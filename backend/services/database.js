const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

// Create a connection pool using the environment variables for the database configuration
const pool = mysql.createPool({
  host: process.env.DB_HOST, // Database host
  user: process.env.DB_USER, // Database user
  password: process.env.DB_PASSWORD, // Database user's password
  database: process.env.DB_NAME, // Database name
});

/**
 * @function getClassById
 * @param {string} classId - The ID of the class.
 * @description Checks if a class exists in the database.
 * @returns {boolean} - True if class exists, false otherwise.
 */
const getClassById = async (classId) => {
  const [rows] = await pool.query('SELECT * FROM classroom WHERE id = ?', [
    classId,
  ]);
  return rows.length > 0; // Returns true if class exists, false otherwise
};

/**
 * @function createClass
 * @param {string} className - The name of the class to create.
 * @param {string} classId - The ID of the class to create.
 * @description Creates a new class in the database.
 * @returns {object} - The created class object.
 * @throws Will throw an error if the database query fails.
 */
const createClass = async (classId, className) => {
  try {
    const [rows] = await pool.query(
      'INSERT INTO classroom (id, name) VALUES (?, ?)',
      [classId, className],
    );
    logger.info(`Class created: ${JSON.stringify(rows)}`);
    return rows;
  } catch (error) {
    logger.error(`Error creating class: ${error.message}`);
    throw error;
  }
};

/**
 * @function createUser
 * @param {object} user - User object avec username, name, email, passwordHash, role, classId.
 */
const createUser = async (user) => {
  try {
    const [rows] = await pool.query(
      `INSERT INTO user (username, name, email, password_hash, role, score, id_classroom)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        user.username, // Utilisation de username comme clé primaire
        user.name,
        user.email,
        user.passwordHash,
        user.role,
        0, // Default score
        user.classId,
      ],
    );
    return rows;
  } catch (error) {
    logger.error(`Error creating user: ${error.message}`);
    throw error;
  }
};

/**
 * @function getUserByUsername
 * @param {string} username - Le username à vérifier.
 * @description Vérifie si un utilisateur existe avec le `username`.
 * @returns {object|null} - L'utilisateur trouvé ou null si non trouvé.
 */
const getUserByUsername = async (username) => {
  try {
    const [rows] = await pool.query('SELECT * FROM user WHERE username = ?', [
      username,
    ]);
    return rows.length > 0 ? rows[0] : null; // Si un utilisateur est trouvé, retourne le premier utilisateur.
  } catch (error) {
    logger.error(`Error checking username availability: ${error.message}`);
    throw error;
  }
};

/**
 * @function getUserByEmail
 * @param {string} email - L'email à vérifier.
 * @description Vérifie si un utilisateur existe avec l'email spécifié.
 * @returns {object|null} - L'utilisateur trouvé ou null si non trouvé.
 */
const getUserByEmail = async (email) => {
  try {
    const [rows] = await pool.query('SELECT * FROM user WHERE email = ?', [
      email,
    ]);
    return rows.length > 0 ? rows[0] : null; // Si un utilisateur est trouvé, retourne le premier utilisateur.
  } catch (error) {
    logger.error(`Error checking email availability: ${error.message}`);
    throw error;
  }
};

module.exports = {
  createClass,
  createUser,
  getClassById,
  getUserByUsername,
  getUserByEmail,
};
