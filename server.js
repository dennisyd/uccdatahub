const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2/promise');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const bcrypt = require('bcrypt');
const { Parser } = require('json2csv');
const paypal = require('@paypal/checkout-server-sdk');
require('dotenv').config(); // Load environment variables

// App Configuration
const app = express();
const upload = multer({ dest: 'uploads/' });

// CORS Configuration
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    exposedHeaders: ['Content-Disposition']
}));

// Increase payload size limits
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// PayPal Configuration
let paypalClient;
try {
    // Initialize PayPal with error handling
    const clientId = process.env.REACT_APP_PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error('PayPal credentials are not configured properly');
    }

    console.log('Initializing PayPal with client ID:', clientId.substring(0, 8) + '...');

    const environment = new paypal.core.SandboxEnvironment(clientId, clientSecret);
    paypalClient = new paypal.core.PayPalHttpClient(environment);

    console.log('PayPal client initialized successfully');
} catch (error) {
    console.error('PayPal initialization error:', error);
}

// Additional Middleware
app.use(bodyParser.json());

// Database Configuration
const dbConfig = {
    host: 'localhost',
    user: 'ucc_user',
    password: 'Java28xuvds!!', // Consider using environment variables for sensitive information
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

// Update the secured parties endpoint
app.get('/api/secured-parties', async (req, res) => {
    const { states } = req.query;

    if (!states || states.trim() === '') {
        return res.json([{ value: 'all', label: 'All Secured Parties' }]);
    }

    try {
        const connection = await getConnection();
        const stateList = states.split(',').map(state => state.trim()).filter(state => state !== '');

        if (stateList.length === 0) {
            await connection.end();
            return res.json([{ value: 'all', label: 'All Secured Parties' }]);
        }

        // Sanitize table names to prevent SQL injection
        const validStates = stateList.filter(state => /^[a-zA-Z0-9_]+$/.test(state));
        if (validStates.length !== stateList.length) {
            await connection.end();
            return res.status(400).json({ message: 'Invalid state names provided' });
        }

        let query = 'SELECT DISTINCT `Secured Party Name` FROM (';
        const queryParts = validStates.map(state => {
            return `SELECT \`Secured Party Name\` FROM \`${state}\``;
        });

        query += queryParts.join(' UNION ALL ') + ') AS combined_tables WHERE `Secured Party Name` IS NOT NULL ORDER BY `Secured Party Name`';

        const [rows] = await connection.execute(query);
        await connection.end();

        const parties = rows.map(row => ({
            value: row['Secured Party Name'],
            label: row['Secured Party Name']
        }));

        // Always include the 'All' option at the beginning
        return res.json([{ value: 'all', label: 'All Secured Parties' }, ...parties]);
    } catch (error) {
        console.error('Error fetching secured parties:', error);
        // Return at least the 'All' option in case of error
        return res.status(200).json([{ value: 'all', label: 'All Secured Parties' }]);
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
        let totalRecordCount = 0;
        let fields = null;
        const allRows = [];

        for (const state of states) {
            try {
                console.log(`Processing state: ${state}`);
                console.log('Parameters:', {
                    state,
                    dataType,
                    selectedParties,
                    uccType,
                    role,
                    filingDateStart,
                    filingDateEnd
                });

                // Check if table exists
                const [tableCheck] = await connection.execute(
                    'SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?',
                    [state]
                );

                if (tableCheck[0].count === 0) {
                    console.error(`Table for state ${state} does not exist`);
                    continue;
                }

                const [results] = await connection.execute(
                    'CALL GetUCCData(?, ?, ?, ?, ?, ?, ?)',
                    [
                        state,
                        dataType,
                        selectedParties,
                        uccType,
                        role,
                        filingDateStart || null,
                        filingDateEnd || null
                    ]
                );

                // Log the debug SQL if available
                if (results[0] && results[0][0] && results[0][0]['Debug: Generated SQL']) {
                    console.log('Generated SQL:', results[0][0]['Debug: Generated SQL']);
                }

                // The actual data will be in the next result set
                if (results[1] && Array.isArray(results[1])) {
                    const rows = results[1];
                    console.log(`Found ${rows.length} rows for ${state}`);

                    const stateRows = rows.map(row => ({
                        State: state.toUpperCase(),
                        ...row,
                        DataType: dataType,
                    }));

                    allRows.push(...stateRows);
                    totalRecordCount += rows.length;
                } else {
                    console.log(`No valid results found for ${state}`);
                    console.log('Results structure:', JSON.stringify(results, null, 2));
                }
            } catch (stateError) {
                console.error(`Error processing state ${state}:`, stateError);
                if (stateError.sqlMessage) {
                    console.error('SQL Error:', stateError.sqlMessage);
                }
            }
        }

        await connection.end();

        if (totalRecordCount === 0) {
            return res.status(404).json({ error: 'No data found for the given criteria' });
        }

        const json2csvParser = new Parser({ fields: Object.keys(allRows[0]) });
        const csvData = json2csvParser.parse(allRows);

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

// Save Profile Route
app.post('/api/save-profile', async (req, res) => {
    const { name, dataType, selectedStates, selectedParties, role, uccType, filingDateStart, filingDateEnd, userId } = req.body;

    if (!name || !userId) {
        return res.status(400).json({ error: 'Profile name and user ID are required' });
    }

    try {
        const connection = await getConnection();

        // Create a clean config object
        const config = {
            dataType,
            selectedStates: selectedStates.map(state => ({
                value: state.value,
                label: state.label
            })),
            selectedParties: selectedParties.map(party => ({
                value: party.value,
                label: party.label
            })),
            role,
            uccType,
            filingDateStart: filingDateStart || null,
            filingDateEnd: filingDateEnd || null
        };

        // Convert to JSON string for storage
        const configString = JSON.stringify(config);
        console.log('Saving profile config:', configString); // Debug log

        const query = `
            INSERT INTO profiles (name, config, user_id) 
            VALUES (?, ?, ?) 
            ON DUPLICATE KEY UPDATE config = ?
        `;

        await connection.execute(query, [name, configString, userId, configString]);
        await connection.end();

        res.status(200).json({ message: 'Profile saved successfully' });
    } catch (error) {
        console.error('Error saving profile:', error);
        res.status(500).json({ error: 'An error occurred while saving the profile' });
    }
});

// Load Profiles Route
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

        const profiles = rows.map(row => {
            try {
                // Parse the stored JSON string
                const config = typeof row.config === 'string' ? JSON.parse(row.config) : row.config;

                return {
                    name: row.name,
                    config: {
                        ...config,
                        // Ensure dates are properly formatted
                        filingDateStart: config.filingDateStart ? config.filingDateStart : null,
                        filingDateEnd: config.filingDateEnd ? config.filingDateEnd : null
                    }
                };
            } catch (parseError) {
                console.error(`Error parsing config for profile ${row.name}:`, parseError);
                console.error('Raw config:', row.config);
                return null;
            }
        }).filter(profile => profile !== null);

        await connection.end();
        console.log('Sending profiles:', JSON.stringify(profiles, null, 2)); // Debug log
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

app.post('/api/verify-payment', async (req, res) => {
    const { orderID, csvData, amount, recordCount, userId } = req.body;

    try {
        // Validate required fields
        if (!orderID || !csvData || !amount || !userId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required payment information'
            });
        }

        // Capture the order with PayPal
        const request = new paypal.orders.OrdersCaptureRequest(orderID);
        request.requestBody({}); // Empty object as per PayPal SDK requirements

        const captureResponse = await paypalClient.execute(request);
        const status = captureResponse.result.status;

        if (status !== 'COMPLETED') {
            return res.status(400).json({
                success: false,
                message: `Payment not completed. Status: ${status}`
            });
        }

        // Proceed to store transaction details in the database
        const connection = await getConnection();

        try {
            // Start transaction
            await connection.beginTransaction();

            // Store transaction details
            const [result] = await connection.execute(
                `INSERT INTO transactions 
                (user_id, order_id, amount, record_count, status, csv_data) 
                VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    userId,
                    orderID,
                    amount,
                    recordCount || 0,
                    'COMPLETED',
                    csvData
                ]
            );

            // Update user's last purchase date if needed
            await connection.execute(
                `UPDATE users 
                SET last_purchase = CURRENT_TIMESTAMP 
                WHERE id = ?`,
                [userId]
            );

            // Commit transaction
            await connection.commit();

            // Log successful transaction
            console.log(`Payment verified and stored: OrderID ${orderID}, UserID ${userId}`);

            res.json({
                success: true,
                message: 'Payment verified and recorded successfully',
                orderID: orderID,
                transactionId: result.insertId
            });

        } catch (dbError) {
            // Rollback transaction on error
            await connection.rollback();
            throw dbError;
        } finally {
            await connection.end();
        }

    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying payment: ' + error.message
        });
    }
});

// Retrieve Past Transactions
app.get('/api/transactions/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const connection = await getConnection();

        const [rows] = await connection.execute(
            `SELECT 
                id,
                order_id,
                amount,
                record_count,
                status,
                payment_date
            FROM transactions 
            WHERE user_id = ? 
            ORDER BY payment_date DESC`,
            [userId]
        );

        await connection.end();

        res.json({
            success: true,
            transactions: rows
        });

    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching transaction history'
        });
    }
});

// Download Past Purchases
app.get('/api/download-transaction/:transactionId/:userId', async (req, res) => {
    const { transactionId, userId } = req.params;

    try {
        const connection = await getConnection();

        const [rows] = await connection.execute(
            `SELECT csv_data 
            FROM transactions 
            WHERE id = ? AND user_id = ?`,
            [transactionId, userId]
        );

        await connection.end();

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found or unauthorized'
            });
        }

        const csvData = rows[0].csv_data;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=ucc_data_${transactionId}.csv`);
        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
        res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
        res.setHeader('Access-Control-Allow-Credentials', 'true');

        res.send(csvData);

    } catch (error) {
        console.error('Error downloading transaction:', error);
        res.status(500).json({
            success: false,
            message: 'Error downloading transaction data'
        });
    }
});

// Load Configuration
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
    // First create table with all columns as VARCHAR
    const columnDefinitions = columns.map(col => `\`${col.content}\` VARCHAR(255)`).join(', ');
    const createQuery = `
        CREATE TABLE IF NOT EXISTS \`${tableName}\` (
            id INT AUTO_INCREMENT PRIMARY KEY, 
            ${columnDefinitions}
        )
    `;
    await connection.execute(createQuery);

    // Then check and modify the Filing Date column if it exists
    const checkQuery = `
        SELECT COLUMN_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = ? 
        AND COLUMN_NAME = 'Filing Date' 
        AND TABLE_SCHEMA = DATABASE()
    `;
    const [columns_result] = await connection.execute(checkQuery, [tableName]);

    if (columns_result.length > 0 && columns_result[0].COLUMN_TYPE !== 'date') {
        // Modify the column type to DATE
        const alterQuery = `
            ALTER TABLE \`${tableName}\`
            MODIFY COLUMN \`Filing Date\` DATE
        `;
        await connection.execute(alterQuery);
        console.log(`Modified Filing Date column in ${tableName} to DATE type`);
    }
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
            })
            .on('error', (error) => {
                reject(error);
            });
    });
}

async function insertRow(connection, tableName, columns, row) {
    const columnNames = columns.map(col => col.content);
    const values = columnNames.map(col => {
        const value = row[col];
        // Special handling for Filing Date column
        if (col === 'Filing Date' && value) {
            // Convert date from MM/DD/YYYY to YYYY-MM-DD format
            const parts = value.split('/');
            if (parts.length === 3) {
                return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
            }
        }
        return value || null;
    });

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
