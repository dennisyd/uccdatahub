const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2/promise');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const { Parser } = require('json2csv');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database connection configuration
const dbConfig = {
  host: 'localhost',
  user: 'ucc_user',
  password: 'Java28xuvds!!',
  database: 'ucc_data_hub',
};

// Database connection function
async function getConnection() {
  return await mysql.createConnection(dbConfig);
}

// Secured Parties Route
app.get('/api/secured-parties', async (req, res) => {
    const { states } = req.query;
  
    if (!states) {
      return res.status(400).json({ error: 'States parameter is required' });
    }
  
    const stateList = states.split(',');
  
    try {
      const connection = await getConnection();
  
      let query = 'SELECT DISTINCT `Secured Party Name` FROM (';
      const queryParts = stateList.map(state => `SELECT \`Secured Party Name\` FROM \`${state}\``);
      query += queryParts.join(' UNION ALL ') + ') AS combined_tables ORDER BY `Secured Party Name`';
  
      const [rows] = await connection.execute(query);
      await connection.end();
  
      const parties = rows.map(row => ({
        value: row['Secured Party Name'],
        label: row['Secured Party Name']
      }));
  
      res.json([{ value: 'all', label: 'All Secured Parties' }, ...parties]);
    } catch (error) {
      console.error('Error fetching secured parties:', error);
      res.status(500).json({ error: 'An error occurred while fetching secured parties' });
    }
  });
  
// CSV Generation Route
app.post('/api/generate-csv', async (req, res) => {
  const { states, dataType, role, uccType, securedParties } = req.body;
  
  try {
    const connection = await getConnection();
    
    let allRows = [];
    let totalRecordCount = 0;

    for (const state of states) {
      const query = `
        SELECT * FROM \`${state}\`
        WHERE ${role === 'owner' ? "`Filing Type` = 'Owner'" : '1=1'}
        ${uccType === 'contactInfo' ? "AND `Secured Party Address` IS NOT NULL" : ''}
        ${securedParties.includes('all') ? '' : `AND \`Secured Party Name\` IN (${securedParties.map(p => `'${p}'`).join(',')})`}
      `;
      
      const [rows] = await connection.execute(query);
      
      const stateRows = rows.map(row => ({
        State: state.toUpperCase(),
        ...row,
        DataType: dataType,
      }));

      allRows = allRows.concat(stateRows);
      totalRecordCount += rows.length;
    }

    await connection.end();

    // Convert the results to CSV
    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(allRows);

    // Send the CSV data and the record count
    res.json({ csv, recordCount: totalRecordCount });
  } catch (error) {
    console.error('Error generating CSV:', error);
    res.status(500).send('An error occurred while generating the CSV');
  }
});

// Data Import Route
app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const { state, commonColumns, table1Columns, table2Columns } = req.body;
  const table1Name = state.replace(/\s/g, '').toLowerCase();
  const table2Name = `${table1Name}2`;

  console.log('Upload request received:');
  console.log('State:', state);
  console.log('Common Columns:', commonColumns);
  console.log('Table 1 Columns:', table1Columns);
  console.log('Table 2 Columns:', table2Columns);

  try {
    const connection = await getConnection();

    // Create tables
    await createTable(connection, table1Name, JSON.parse(commonColumns).concat(JSON.parse(table1Columns)));
    if (table2Columns && JSON.parse(table2Columns).length > 0) {
      await createTable(connection, table2Name, JSON.parse(commonColumns).concat(JSON.parse(table2Columns)));
    }

    // Process CSV and insert data
    await processCSV(req.file.path, connection, table1Name, table2Name, JSON.parse(commonColumns), JSON.parse(table1Columns), JSON.parse(table2Columns));

    await connection.end();
    res.status(200).send('Data uploaded successfully');
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('An error occurred while processing the upload');
  }
});

// Save Configuration Route
app.post('/api/save-configuration', async (req, res) => {
  const { state, commonColumns, table1Columns, table2Columns } = req.body;

  if (!state) {
    return res.status(400).json({ error: 'State is required' });
  }

  try {
    const connection = await getConnection();
    const query = 'INSERT INTO configurations (state, config) VALUES (?, ?) ON DUPLICATE KEY UPDATE config = ?';
    const config = JSON.stringify({ commonColumns, table1Columns, table2Columns });
    await connection.execute(query, [state, config, config]);
    await connection.end();
    res.status(200).json({ message: 'Configuration saved successfully' });
  } catch (error) {
    console.error('Error saving configuration:', error);
    res.status(500).json({ error: 'An error occurred while saving the configuration' });
  }
});

// Load Configuration Route
app.get('/api/load-configuration', async (req, res) => {
  const { state } = req.query;

  if (!state) {
    return res.status(400).json({ error: 'State is required' });
  }

  try {
    const connection = await getConnection();
    const [rows] = await connection.execute('SELECT config FROM configurations WHERE state = ?', [state]);
    await connection.end();

    if (rows.length > 0) {
      let config = rows[0].config;

      // Check if config is a string, if so, try to parse it
      if (typeof config === 'string') {
        try {
          config = JSON.parse(config);
        } catch (parseError) {
          console.error('Error parsing stored configuration:', parseError);
          return res.status(500).json({ error: 'Stored configuration is not valid JSON' });
        }
      }

      // At this point, config should be an object
      if (typeof config !== 'object' || config === null) {
        return res.status(500).json({ error: 'Stored configuration is not a valid object' });
      }

      // Ensure all expected properties are present
      const expectedProps = ['commonColumns', 'table1Columns', 'table2Columns'];
      for (const prop of expectedProps) {
        if (!Array.isArray(config[prop])) {
          config[prop] = [];
        }
      }

      res.status(200).json(config);
    } else {
      res.status(404).json({ error: 'Configuration not found' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred while loading the configuration' });
  }
});

// Helper functions
async function createTable(connection, tableName, columns) {
  const columnDefinitions = columns.map(col => `\`${col.content}\` VARCHAR(255)`).join(', ');
  const query = `CREATE TABLE IF NOT EXISTS \`${tableName}\` (id INT AUTO_INCREMENT PRIMARY KEY, ${columnDefinitions})`;
  await connection.execute(query);
}

async function processCSV(filePath, connection, table1Name, table2Name, commonColumns, table1Columns, table2Columns) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          for (const row of results) {
            await insertRow(connection, table1Name, commonColumns.concat(table1Columns), row);
            if (table2Columns.length > 0) {
              await insertRow(connection, table2Name, commonColumns.concat(table2Columns), row);
            }
          }
          fs.unlinkSync(filePath); // Remove the temporary file
          resolve();
        } catch (error) {
          reject(error);
        }
      });
  });
}

async function insertRow(connection, tableName, columns, row) {
  const columnNames = columns.map(col => col.content);
  const values = columnNames.map(col => row[col] || null);
  const placeholders = columnNames.map(() => '?').join(', ');
  const query = `INSERT INTO \`${tableName}\` (\`${columnNames.join('`, `')}\`) VALUES (${placeholders})`;
  await connection.execute(query, values);
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});