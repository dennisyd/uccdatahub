const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'ucc_user',
  password: 'Java28xuvds!!',
  database: 'ucc_data_hub'
};

async function testConnection() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('Successfully connected to the database.');
    await connection.end();
  } catch (error) {
    console.error('Failed to connect to the database:', error);
  }
}

testConnection();