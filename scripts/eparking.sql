CREATE DATABASE IF NOT EXISTS eparking;

USE eparking;

CREATE TABLE IF NOT EXISTS price
(
    year          YEAR NOT NULL PRIMARY KEY,
    yearly_price  DECIMAL(5, 2) NOT NULL,
    monthly_price DECIMAL(5, 2) NOT NULL
    );

CREATE TABLE IF NOT EXISTS sector
(
    `key`       VARCHAR(50) NOT NULL,
    school_name ENUM ('HEIA', 'HEG', 'HETS', 'HEDS') NOT NULL,
    PRIMARY KEY (`key`, school_name)
    );

CREATE INDEX school_name_index ON sector (school_name);

CREATE TABLE IF NOT EXISTS person
(
    first_name         VARCHAR(50) NOT NULL,
    last_name          VARCHAR(50) NOT NULL,
    email              VARCHAR(254) NOT NULL PRIMARY KEY,
    phone              VARCHAR(10) NOT NULL,
    address            VARCHAR(60) NOT NULL,
    npa                DECIMAL(4) NOT NULL,
    locality           VARCHAR(30) NOT NULL,
    language           VARCHAR(6) NOT NULL,
    sector_key         VARCHAR(50) NOT NULL,
    sector_school_name ENUM ('HEIA', 'HEG', 'HETS', 'HEDS') NOT NULL,
    work_percentage    DECIMAL(3) NOT NULL,
    CONSTRAINT person_sector_key_fk FOREIGN KEY (sector_key) REFERENCES sector
(`key`) ON DELETE CASCADE,
    CONSTRAINT person_sector_school_name_fk FOREIGN KEY (sector_school_name)
    REFERENCES sector (school_name) ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS demand
(
    id               VARCHAR(36) NOT NULL PRIMARY KEY,
    date             TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    period           ENUM ('monthly', 'yearly') NOT NULL,
    start_date       DATE NOT NULL,
    number_of_months DECIMAL(2) NOT NULL,
    state            ENUM ('pending', 'accepted', 'refused') DEFAULT 'pending'
    NOT NULL,
    rules            TINYINT(1) NOT NULL,
    data_protection  TINYINT(1) NOT NULL,
    price_year       YEAR NOT NULL,
    person_email     VARCHAR(254) NOT NULL,
    CONSTRAINT demand_person_email_fk FOREIGN KEY (person_email) REFERENCES
    person (email) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT demand_price_year_fk FOREIGN KEY (price_year) REFERENCES price (
    year)
    );

CREATE TABLE IF NOT EXISTS occupant
(
    id         INT auto_increment PRIMARY KEY,
    demand_id  VARCHAR(36) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name  VARCHAR(50) NOT NULL,
    address    VARCHAR(60) NOT NULL,
    npa        DECIMAL(4) NOT NULL,
    locality   VARCHAR(30) NOT NULL,
    CONSTRAINT fk_occupant_demand_id FOREIGN KEY (demand_id) REFERENCES demand
(id) ON UPDATE CASCADE ON DELETE CASCADE
    );

CREATE INDEX person_sector_school_name_index ON person (sector_school_name);

CREATE TABLE IF NOT EXISTS vehicle
(
    demand_id                 VARCHAR(36) NOT NULL,
    plate                     VARCHAR(9) NOT NULL,
    car_registration_filename VARCHAR(64) NOT NULL,
    PRIMARY KEY (demand_id, plate),
    CONSTRAINT vehicle_ibfk_1 FOREIGN KEY (demand_id) REFERENCES demand (id) ON
    UPDATE CASCADE ON DELETE CASCADE
    );
