-- Crée la base si elle n'existe pas
CREATE DATABASE IF NOT EXISTS amicooked CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Utilise la base
USE amicooked;

-- Table classroom
CREATE TABLE IF NOT EXISTS classroom (
                                         id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL
    );

-- Table user (avec username comme clé primaire)
CREATE TABLE IF NOT EXISTS user (
                                    username VARCHAR(50) PRIMARY KEY,  -- Utilisation de username comme clé primaire
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(10) NOT NULL CHECK (role IN ('user', 'admin')),
    score INT DEFAULT 0,
    id_classroom VARCHAR(36),
    FOREIGN KEY (id_classroom) REFERENCES classroom(id) ON DELETE SET NULL
    );

-- Table exam
CREATE TABLE IF NOT EXISTS exam (
                                    id INT AUTO_INCREMENT PRIMARY KEY,
                                    name VARCHAR(100) NOT NULL,
    id_classroom VARCHAR(36) NOT NULL,
    FOREIGN KEY (id_classroom) REFERENCES classroom(id) ON DELETE CASCADE
    );

-- Table bet
CREATE TABLE IF NOT EXISTS bet (
                                   id_exam INT NOT NULL,
                                   id_user VARCHAR(50) NOT NULL,  -- Modification pour utiliser username
    grade DECIMAL(2,1) NOT NULL CHECK (grade >= 1.0 AND grade <= 6.0),
    PRIMARY KEY (id_exam, id_user),
    FOREIGN KEY (id_exam) REFERENCES exam(id) ON DELETE CASCADE,
    FOREIGN KEY (id_user) REFERENCES user(username) ON DELETE CASCADE
    );

-- Table result
CREATE TABLE IF NOT EXISTS result (
                                      id_exam INT NOT NULL,
                                      id_user VARCHAR(50) NOT NULL,  -- Modification pour utiliser username
    grade DECIMAL(2,1) NOT NULL CHECK (grade >= 1.0 AND grade <= 6.0),
    PRIMARY KEY (id_exam, id_user),
    FOREIGN KEY (id_exam) REFERENCES exam(id) ON DELETE CASCADE,
    FOREIGN KEY (id_user) REFERENCES user(username) ON DELETE CASCADE
    );
