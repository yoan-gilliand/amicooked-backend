const mysql = require('mysql2/promise');

// Assuming the logger is already configured and available
const logger = require('../utils/logger'); // Adjust the path according to your project structure

// Create a connection pool using the environment variables for the database configuration
const pool = mysql.createPool({
  host: process.env.DB_HOST, // Database host
  user: process.env.DB_USER, // Database user
  password: process.env.DB_PASSWORD, // Database user's password
  database: process.env.DB_NAME, // Database name
});

