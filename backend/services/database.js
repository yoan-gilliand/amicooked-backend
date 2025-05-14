const Database = require('better-sqlite3');
const path = require('path');
const logger = require('../utils/logger');

// Crée ou ouvre la base de données SQLite
const db = new Database(path.resolve(__dirname, '../db/database.sqlite'));

// Active le support des clés étrangères (désactivé par défaut dans SQLite)
db.exec('PRAGMA foreign_keys = ON');

// Création des tables
db.exec(`
  -- Table classroom
  CREATE TABLE IF NOT EXISTS classroom (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL
  );

  -- Table user
  CREATE TABLE IF NOT EXISTS user (
    username TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'admin')),
    score INTEGER DEFAULT 0,
    id_classroom TEXT,
    FOREIGN KEY (id_classroom) REFERENCES classroom(id) ON DELETE SET NULL
  );

  -- Table exam
  CREATE TABLE IF NOT EXISTS exam (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    date DATE NOT NULL,
    id_classroom TEXT NOT NULL,
    FOREIGN KEY (id_classroom) REFERENCES classroom(id) ON DELETE CASCADE
  );

  -- Table bet
  CREATE TABLE IF NOT EXISTS bet (
    id_exam INTEGER NOT NULL,
    id_user TEXT NOT NULL,
    grade REAL NOT NULL CHECK (grade >= 1.0 AND grade <= 6.0),
    PRIMARY KEY (id_exam, id_user),
    FOREIGN KEY (id_exam) REFERENCES exam(id) ON DELETE CASCADE,
    FOREIGN KEY (id_user) REFERENCES user(username) ON DELETE CASCADE
  );

  -- Table result
  CREATE TABLE IF NOT EXISTS result (
    id_exam INTEGER NOT NULL,
    id_user TEXT NOT NULL,
    grade REAL NOT NULL CHECK (grade >= 1.0 AND grade <= 6.0),
    PRIMARY KEY (id_exam, id_user),
    FOREIGN KEY (id_exam) REFERENCES exam(id) ON DELETE CASCADE,
    FOREIGN KEY (id_user) REFERENCES user(username) ON DELETE CASCADE
  );
`);

logger.info('SQLite database initialized');

// Exemples de fonctions pour interagir avec la base de données

// Ajouter une classe
const createClass = (classId, className) => {
  try {
    const stmt = db.prepare('INSERT INTO classroom (id, name) VALUES (?, ?)');
    const info = stmt.run(classId, className);
    logger.info(`Class created: ${JSON.stringify(info)}`);
    return info;
  } catch (error) {
    logger.error(`Error creating class: ${error.message}`);
    throw error;
  }
};

// Obtenir une classe par son ID
const getClassById = (classId) => {
  const stmt = db.prepare('SELECT * FROM classroom WHERE id = ?');
  const row = stmt.get(classId);
  return row || null;
};

// Ajouter un utilisateur
const createUser = (user) => {
  try {
    const stmt = db.prepare(`
      INSERT INTO user (username, name, email, password_hash, role, score, id_classroom)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      user.username,
      user.name,
      user.email,
      user.passwordHash,
      user.role,
      0, // Default score
      user.classId,
    );
    logger.info(`User created: ${user.username}`);
    return info;
  } catch (error) {
    logger.error(`Error creating user: ${error.message}`);
    throw error;
  }
};

// Obtenir un utilisateur par son username
const getUserByUsername = (username) => {
  const stmt = db.prepare('SELECT * FROM user WHERE username = ?');
  const row = stmt.get(username);
  return row || null;
};

// Obtenir un utilisateur par son email
const getUserByEmail = (email) => {
  const stmt = db.prepare('SELECT * FROM user WHERE email = ?');
  const row = stmt.get(email);
  return row || null;
};

// Ajouter un pari (bet)
const createBet = (examId, grade, username) => {
  try {
    const stmt = db.prepare(`
      INSERT INTO bet (id_exam, id_user, grade)
      VALUES (?, ?, ?)
    `);
    const info = stmt.run(examId, username, grade);
    logger.info(
      `Bet created: Exam ID = ${examId}, User = ${username}, Grade = ${grade}`,
    );
    return info;
  } catch (error) {
    logger.error(`Error creating bet: ${error.message}`);
    throw error;
  }
};

// Ajouter un résultat (result)
const createResult = (examId, grade, username) => {
  try {
    const stmt = db.prepare(`
      INSERT INTO result (id_exam, id_user, grade)
      VALUES (?, ?, ?)
    `);
    const info = stmt.run(examId, username, grade);
    logger.info(
      `Result created: Exam ID = ${examId}, User = ${username}, Grade = ${grade}`,
    );
    return info;
  } catch (error) {
    logger.error(`Error creating result: ${error.message}`);
    throw error;
  }
};

// Ajouter un examen
const createExam = (exam) => {
  try {
    const stmt = db.prepare(`
      INSERT INTO exam (name, date, id_classroom)
      VALUES (?, ?, ?)
    `);
    const info = stmt.run(exam.name, exam.date, exam.classId);
    logger.info(`Exam created: ${JSON.stringify(info)}`);
    return info;
  } catch (error) {
    logger.error(`Error creating exam: ${error.message}`);
    throw error;
  }
};

// Obtenir un pari par ID d'examen et nom d'utilisateur
const getBetByExamIdAndUsername = (examId, username) => {
  const stmt = db.prepare(`
    SELECT * FROM bet WHERE id_exam = ? AND id_user = ?
  `);
  const row = stmt.get(examId, username);
  return row || null;
};

// Mettre à jour le score d'un utilisateur
const updateUserScore = (username, score) => {
  try {
    const stmt = db.prepare(`
      UPDATE user SET score = ? WHERE username = ?
    `);
    const info = stmt.run(score, username);
    logger.info(`User score updated: ${username}, New Score = ${score}`);
    return info;
  } catch (error) {
    logger.error(`Error updating user score: ${error.message}`);
    throw error;
  }
};

// Obtenir la liste des utilisateurs d'une classe et leur score
const getUsersByClassId = (classId) => {
  const stmt = db.prepare(`
    SELECT username, score FROM user WHERE id_classroom = ?
  `);
  const rows = stmt.all(classId);
  return rows || [];
};

// Obtenir tous les examens pour lesquels l'utilisateur n'a pas encore parié
const getUpcomingExams = (username) => {
  const stmt = db.prepare(`
    SELECT e.id, e.name, e.date FROM exam e
    LEFT JOIN bet b ON e.id = b.id_exam AND b.id_user = ?
    WHERE b.id_user IS NULL
  `);
  const rows = stmt.all(username);
  return rows || [];
};

// Obtenir tous les examens qui n'ont pas encore de résultats
const getPastExamsWithoutResults = (username) => {
  const stmt = db.prepare(`
    SELECT e.id, e.name, e.date FROM exam e
    JOIN bet b ON e.id = b.id_exam AND b.id_user = ?
    LEFT JOIN result r ON e.id = r.id_exam AND r.id_user = ?
    WHERE r.id_user IS NULL
  `);
  const rows = stmt.all(username, username);
  return rows || [];
}

// Obtenir tous les résultats d'un utilisateur
const getResultsByUsername = (username) => {
  const stmt = db.prepare(`
    SELECT e.id, e.name, e.date, r.grade FROM result r
    JOIN exam e ON r.id_exam = e.id
    WHERE r.id_user = ?
  `);
  const rows = stmt.all(username);
  return rows || [];
};

// Obtenir le nombre de paris d'un utilisateur
const getBetCountByUsername = (username) => {
  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM bet WHERE id_user = ?
  `);
  const row = stmt.get(username);
  return row ? row.count : 0;
};

// Obtenir le nombre de résultats d'un utilisateur
const getResultCountByUsername = (username) => {
  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM result WHERE id_user = ?
  `);
  const row = stmt.get(username);
  return row ? row.count : 0;
};

// Obtenir le nombre de paris exacts d'un utilisateur
const getExactBetCountByUsername = (username) => {
  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM bet b
    JOIN result r ON b.id_exam = r.id_exam AND b.id_user = r.id_user
    WHERE b.grade = r.grade AND b.id_user = ?
  `);
  const row = stmt.get(username);
  return row ? row.count : 0;
};


module.exports = {
  createClass,
  getClassById,
  createUser,
  getUserByUsername,
  getUserByEmail,
  createBet,
  createResult,
  createExam,
  getBetByExamIdAndUsername,
  updateUserScore,
  getUsersByClassId,
  getUpcomingExams,
  getPastExamsWithoutResults,
  getResultsByUsername,
  getBetCountByUsername,
  getResultCountByUsername,
  getExactBetCountByUsername,
};
