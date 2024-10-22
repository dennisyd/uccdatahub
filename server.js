const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2/promise');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const bcrypt = require('bcrypt');
const { Parser } = require('json2csv');

// App Configuration
const app = express();
const upload = multer({ dest: 'uploads/' });

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database Configuration
const dbConfig = {
  host: 'localhost',
  user: 'ucc_user',
  password: 'Java28xuvds!!',
  database: 'ucc_data_hub',
};

// Database Connection Function
async function getConnection() {
  return await mysql.createConnection(dbConfig);
}

// Authentication Routes
app.post('/api/register', async (req, res) => {
  const { firstName, lastName, businessName, email, password } = req.body;

  try {
    const connection = await getConnection();

    // Check if email already exists
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      await connection.end();
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const [result] = await connection.execute(
      'INSERT INTO users (first_name, last_name, business_name, email, password_hash) VALUES (?, ?, ?, ?, ?)',
      [firstName, lastName, businessName, email, passwordHash]
    );

    await connection.end();

    res.status(201).json({
      message: 'Registration successful',
      userId: result.insertId
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error during registration' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const connection = await getConnection();
    const [users] = await connection.execute(
      'SELECT id, first_name, last_name, password_hash FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      await connection.end();
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      await connection.end();
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Update last login timestamp
    await connection.execute(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    await connection.end();

    res.json({
      userId: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error during login' });
  }
});

// Data Routes
app.get('/api/secured-parties', async (req, res) => {
  const { states } = req.query;

  if (!states) {
    return res.status(400).json({ error: 'States parameter is required' });
  }

  try {
    const connection = await getConnection();
    const stateList = states.split(',');

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

app.post('/api/generate-csv', async (req, res) => {
  const { states, dataType, selectedParties, uccType, role, filingDateStart, filingDateEnd } = req.body;
  
  try {
    console.log('CSV Generation Request:', { 
      states, dataType, selectedParties, uccType, role, filingDateStart, filingDateEnd 
    });

    if (!states || !Array.isArray(states) || states.length === 0) {
      return res.status(400).json({ error: 'At least one state must be selected' });
    }

    const connection = await getConnection();
    let allRows = [];
    let totalRecordCount = 0;

    for (const state of states) {
      const securedPartiesString = selectedParties && selectedParties.length > 0
        ? selectedParties.map(party => `'${party}'`).join(',')
        : 'all';

      console.log(`Processing state: ${state}`);
      console.log(`Secured parties: ${securedPartiesString}`);

      try {
        const [results] = await connection.execute(
          'CALL GetUCCData(?, ?, ?, ?, ?, ?, ?)',
          [
            state,
            dataType,
            securedPartiesString,
            uccType,
            role,
            filingDateStart || null,
            filingDateEnd || null
          ]
        );

        // Log the structure of results for debugging
        console.log(`Raw results structure for ${state}:`, 
          JSON.stringify(results.map(r => Object.keys(r)), null, 2)
        );

        // The second element (index 1) contains the actual data rows
        if (results && Array.isArray(results[1])) {
          const rows = results[1];
          console.log(`Found ${rows.length} rows for ${state}`);

          const stateRows = rows.map(row => ({
            State: state.toUpperCase(),
            ...row,
            DataType: dataType,
          }));

          allRows = allRows.concat(stateRows);
          totalRecordCount += rows.length;
        } else {
          console.log(`No valid results found for ${state}`);
        }
      } catch (stateError) {
        console.error(`Error processing state ${state}:`, stateError);
      }
    }

    await connection.end();

    if (totalRecordCount === 0) {
      return res.status(404).json({ error: 'No data found for the given criteria' });
    }

    console.log(`Total records found: ${totalRecordCount}`);

    // Get the fields from the first row
    const fields = Object.keys(allRows[0]);

    // Convert the results to CSV
    const json2csvParser = new Parser({ fields });
    const csvData = json2csvParser.parse(allRows);

    // Send the CSV data and the record count
    res.json({ 
      csv: csvData, 
      recordCount: totalRecordCount,
      message: 'CSV generated successfully'
    });
  } catch (error) {
    console.error('Error generating CSV:', error);
    res.status(500).json({ 
      error: 'An error occurred while generating the CSV', 
      details: error.message 
    });
  }
});

// Profile Routes
app.post('/api/save-profile', async (req, res) => {
  const { name, dataType, selectedStates, selectedParties, role, uccType, filingDateStart, filingDateEnd, userId } = req.body;

  if (!name || !userId) {
    return res.status(400).json({ error: 'Profile name and user ID are required' });
  }

  try {
    const connection = await getConnection();
    const config = JSON.stringify({ 
      dataType, selectedStates, selectedParties, role, uccType, filingDateStart, filingDateEnd 
    });

    const query = `
      INSERT INTO profiles (name, config, user_id) 
      VALUES (?, ?, ?) 
      ON DUPLICATE KEY UPDATE config = ?
    `;

    await connection.execute(query, [name, config, userId, config]);
    await connection.end();
    
    res.status(200).json({ message: 'Profile saved successfully' });
  } catch (error) {
    console.error('Error saving profile:', error);
    res.status(500).json({ error: 'An error occurred while saving the profile' });
  }
});

app.get('/api/load-profiles', async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const connection = await getConnection();
    const [rows] = await connection.execute(
      'SELECT name, config FROM profiles WHERE user_id = ?', 
      [userId]
    );
    await connection.end();

    const profiles = rows.map(row => ({
      name: row.name,
      config: JSON.parse(row.config)
    }));

    res.status(200).json(profiles);
  } catch (error) {
    console.error('Error loading profiles:', error);
    res.status(500).json({ error: 'An error occurred while loading the profiles' });
  }
});

// Configuration Routes
app.post('/api/save-configuration', async (req, res) => {
  const { state, commonColumns, table1Columns, table2Columns } = req.body;

  if (!state) {
    return res.status(400).json({ error: 'State is required' });
  }

  try {
    const connection = await getConnection();
    const config = JSON.stringify({ commonColumns, table1Columns, table2Columns });
    
    await connection.execute(
      'INSERT INTO configurations (state, config) VALUES (?, ?) ON DUPLICATE KEY UPDATE config = ?',
      [state, config, config]
    );
    
    await connection.end();
    res.status(200).json({ message: 'Configuration saved successfully' });
  } catch (error) {
    console.error('Error saving configuration:', error);
    res.status(500).json({ error: 'An error occurred while saving the configuration' });
  }
});

app.get('/api/load-configuration', async (req, res) => {
  const { state } = req.query;

  if (!state) {
    return res.status(400).json({ error: 'State is required' });
  }

  try {
    const connection = await getConnection();
    const [rows] = await connection.execute(
      'SELECT config FROM configurations WHERE state = ?', 
      [state]
    );
    await connection.end();

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Configuration not found' });
    }

    let config = rows[0].config;
    if (typeof config === 'string') {
      config = JSON.parse(config);
    }

    if (typeof config !== 'object' || config === null) {
      return res.status(500).json({ error: 'Invalid configuration format' });
    }

    // Ensure all expected properties are present
    const expectedProps = ['commonColumns', 'table1Columns', 'table2Columns'];
    for (const prop of expectedProps) {
      if (!Array.isArray(config[prop])) {
        config[prop] = [];
      }
    }

    res.status(200).json(config);
  } catch (error) {
    console.error('Error loading configuration:', error);
    res.status(500).json({ error: 'An error occurred while loading the configuration' });
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

  try {
    const connection = await getConnection();

    // Create tables
    await createTable(connection, table1Name, JSON.parse(commonColumns).concat(JSON.parse(table1Columns)));
    if (table2Columns && JSON.parse(table2Columns).length > 0) {
      await createTable(connection, table2Name, JSON.parse(commonColumns).concat(JSON.parse(table2Columns)));
    }

    // Process CSV and insert data
    await processCSV(req.file.path, connection, table1Name, table2Name, 
      JSON.parse(commonColumns), JSON.parse(table1Columns), JSON.parse(table2Columns));

    await connection.end();
    res.status(200).send('Data uploaded successfully');
  } catch (error) {
    console.error('Error during upload:', error);
    res.status(500).send('An error occurred while processing the upload');
  }
});

// Helper Functions
async function createTable(connection, tableName, columns) {
  const columnDefinitions = columns.map(col => `\`${col.content}\` VARCHAR(255)`).join(', ');
  const query = `
    CREATE TABLE IF NOT EXISTS \`${tableName}\` (
      id INT AUTO_INCREMENT PRIMARY KEY, 
      ${columnDefinitions}
    )
  `;
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
  const query = `
    INSERT INTO \`${tableName}\` 
    (\`${columnNames.join('`, `')}\`) 
    VALUES (${placeholders})
  `;
  await connection.execute(query, values);
}

// Server Startup
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});