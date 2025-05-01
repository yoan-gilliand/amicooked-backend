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

/**
 * @function getSectors
 * @description Retrieves all sectors from the database.
 * @returns {Promise<Array>} A promise that resolves to an array of sector records.
 * @throws Will throw an error if the database query fails.
 */
const getSectors = async () => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query('SELECT * FROM sector');
    logger.info('Sectors retrieved successfully.');
    return rows;
  } catch (error) {
    logger.error('Error fetching sectors from the database.', { error });
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * @function getPrices
 * @description Retrieves the latest price record from the database.
 * @returns {Promise<Object>} A promise that resolves to the latest price record.
 * @throws Will throw an error if the database query fails.
 */
const getPrices = async () => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(
      'SELECT * FROM price ORDER BY year DESC LIMIT 1',
    );
    logger.info('Latest price retrieved successfully.');
    return rows;
  } catch (error) {
    logger.error('Error fetching the latest price from the database.', {
      error,
    });
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * @function saveDemand
 * @description Saves a demand to the database, including associated person, vehicle, and occupant records.
 * @param {Object} formData - The form data to be saved.
 * @param {String} id - The ID to associate with the demand.
 * @returns {Promise<void>}
 * @throws Will throw an error if the database transaction fails.
 */
const saveDemand = async (formData, id) => {
  logger.info('Saving demand to the database.', { demandId: id });
  const connection = await pool.getConnection();

  // Trim and clean up form data
  formData.firstName = formData.firstName.trim();
  formData.lastName = formData.lastName.trim();
  formData.email = formData.email.trim();
  formData.address = formData.address.trim();
  formData.locality = formData.locality.trim();
  formData.rules = formData.rules ? 1 : 0;
  formData.dataProtection = formData.dataProtection ? 1 : 0;

  // Process occupant data
  if (formData.occupants) {
    if (typeof formData.occupants === 'string') {
      formData.occupants = [formData.occupants];
    }
    formData.occupants = formData.occupants.map((occupant) => {
      const parsedOccupant = JSON.parse(occupant);
      parsedOccupant.firstName = parsedOccupant.firstName.trim();
      parsedOccupant.lastName = parsedOccupant.lastName.trim();
      parsedOccupant.address = parsedOccupant.address.trim();
      parsedOccupant.locality = parsedOccupant.locality.trim();
      return parsedOccupant;
    });
  }

  try {
    // Start a transaction
    await connection.beginTransaction();

    // Check if the email already exists in the database
    const verifyEmailQuery = 'SELECT * FROM person WHERE email = ?';
    const [verifyEmailResult] = await connection.execute(verifyEmailQuery, [
      formData.email,
    ]);

    if (verifyEmailResult.length) {
      // Update the existing person record
      const updatePersonQuery = `UPDATE person SET first_name = ?, last_name = ?, phone = ?, address = ?, npa = ?, locality = ?, language = ?, sector_key = ?, sector_school_name = ?, work_percentage = ? WHERE email = ?`;
      await connection.execute(updatePersonQuery, [
        formData.firstName,
        formData.lastName,
        formData.phone,
        formData.address,
        formData.npa,
        formData.locality,
        formData.language,
        formData.sector,
        formData.school,
        formData.workPercentage,
        formData.email,
      ]);
    } else {
      // Insert a new person record
      const insertPersonQuery = `INSERT INTO person (first_name, last_name, email, phone, address, npa, locality, language, sector_key, sector_school_name, work_percentage) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      await connection.execute(insertPersonQuery, [
        formData.firstName,
        formData.lastName,
        formData.email,
        formData.phone,
        formData.address,
        formData.npa,
        formData.locality,
        formData.language,
        formData.sector,
        formData.school,
        formData.workPercentage,
      ]);
    }

    // Insert the demand record
    const insertDemandQuery = `INSERT INTO demand (id, period, start_date, number_of_months, rules, data_protection, price_year, person_email) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    await connection.execute(insertDemandQuery, [
      id,
      formData.period,
      formData.startDate,
      formData.durationInMonths,
      formData.rules,
      formData.dataProtection,
      formData.priceYear,
      formData.email,
    ]);

    // Insert vehicle records
    const insertVehicleQuery = `INSERT INTO vehicle (demand_id, plate, car_registration_filename) VALUES (?, ?, ?)`;
    for (const vehicle of formData.vehicles) {
      await connection.execute(insertVehicleQuery, [
        id,
        vehicle.plate,
        vehicle.carRegistration,
      ]);
    }

    // Insert occupant records if any
    if (formData.occupants) {
      const insertOccupantQuery = `INSERT INTO occupant (demand_id, first_name, last_name, address, npa, locality) VALUES (?, ?, ?, ?, ?, ?)`;
      for (const occupant of formData.occupants) {
        await connection.execute(insertOccupantQuery, [
          id,
          occupant.firstName,
          occupant.lastName,
          occupant.address,
          occupant.npa,
          occupant.locality,
        ]);
      }
    }

    // Commit the transaction
    await connection.commit();
    logger.info('Demand saved successfully.', { demandId: id });
  } catch (error) {
    // Rollback the transaction in case of error
    await connection.rollback();
    logger.error(
      'Error saving demand to the database. Transaction rolled back.',
      { error, demandId: id },
    );
    error.databaseError = true;
    throw error;
  } finally {
    // Release the database connection
    connection.release();
    logger.info('Database connection released after saving demand.', {
      demandId: id,
    });
  }
};

/**
 * @function getDemandsList
 * @description Retrieves a list of demands from the database.
 * @returns {Promise<Array>} A promise that resolves to an array of demand records.
 * @throws Will throw an error if the database query fails.
 */
const getDemandsList = async () => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(
      'SELECT d.id, d.date, p.first_name, p.last_name, s.school_name AS school, p.npa, p.locality, COUNT(o.id) AS number_of_occupants, d.state FROM demand d JOIN person p ON d.person_email = p.email JOIN sector s ON p.sector_key = s.`key` AND p.sector_school_name = s.school_name LEFT JOIN occupant o ON d.id = o.demand_id GROUP BY d.id, d.date, p.first_name, p.last_name, s.school_name, p.npa, p.locality',
    );
    logger.info('Demands list retrieved successfully.');
    return rows;
  } catch (error) {
    logger.error('Error fetching demands list from the database.', { error });
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * @function getDemandById
 * @description Retrieves a demand by ID from the database.
 * @param {String} id - The ID of the demand to retrieve.
 * @returns {Promise<Object>} A promise that resolves to the demand record.
 * @throws Will throw an error if the database query fails.
 */
const getDemandById = async (id) => {
  const connection = await pool.getConnection();
  try {
    // Fetch the demand record and associated person data
    const demandPersonQuery = `SELECT d.*, p.first_name, p.last_name, p.phone, p.address, p.npa, p.locality, p.language, p.sector_key, p.sector_school_name, p.work_percentage FROM demand d JOIN person p ON d.person_email = p.email WHERE d.id = ?`;
    const [demandPersonRows] = await connection.execute(demandPersonQuery, [
      id,
    ]);

    // If no demand is found, return null
    if (!demandPersonRows.length) {
      return null;
    }

    // Fetch associated vehicle data
    const vehicleQuery = `SELECT plate, car_registration_filename FROM vehicle WHERE demand_id = ?`;
    const [vehicleRows] = await connection.execute(vehicleQuery, [id]);

    // Fetch associated occupant data
    const occupantQuery = `SELECT first_name, last_name, address, npa, locality FROM occupant WHERE demand_id = ?`;
    const [occupantRows] = await connection.execute(occupantQuery, [id]);

    // Return the demand record with associated vehicles and occupants
    return {
      ...demandPersonRows[0],
      vehicles: vehicleRows,
      occupants: occupantRows,
    };
    logger.info('Demand fetched successfully.', { demandId: id });
  } catch (error) {
    logger.error('Error fetching demand from the database.', { id, error });
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * @function getAllDemandsDetails
 * @description Retrieves all demands with detailed information from the database.
 * @returns {Promise<Array>} A promise that resolves to an array of detailed demand records.
 * @throws Will throw an error if the database query fails.
 */
const getAllDemandsDetails = async () => {
  const connection = await pool.getConnection();
  try {
    // Fetch all demands with detailed information
    const demandsQuery = `
            SELECT d.id, d.date, p.first_name, p.last_name, p.email, p.phone, p.address, p.npa, p.locality, 
                   sec.school_name AS school, sec.key AS sector, p.work_percentage AS percentage, p.language, d.period, d.start_date, 
                   d.number_of_months, d.rules, d.data_protection, d.state
            FROM demand d
            JOIN person p ON d.person_email = p.email
            JOIN sector sec ON p.sector_key = sec.key AND p.sector_school_name = sec.school_name
            JOIN price pr ON d.price_year = pr.year;
        `;
    const [demands] = await connection.query(demandsQuery);
    const detailedDemands = [];

    // Fetch vehicles and occupants for each demand
    for (let demand of demands) {
      const vehiclesQuery = `SELECT plate, car_registration_filename AS car_registration FROM vehicle WHERE demand_id = ?`;
      const occupantsQuery = `SELECT first_name, last_name, address, npa, locality FROM occupant WHERE demand_id = ?`;

      const [vehicles] = await connection.execute(vehiclesQuery, [demand.id]);
      const [occupants] = await connection.execute(occupantsQuery, [demand.id]);

      detailedDemands.push({
        ...demand,
        vehicles,
        occupants,
      });
    }

    return detailedDemands;
  } catch (error) {
    logger.error('Error fetching all demands details from the database.', {
      error,
    });
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * @function updateDemandState
 * @description Updates the state of a demand in the database.
 * @param {String} id - The ID of the demand to update.
 * @param {String} state - The new state of the demand.
 * @returns {Promise<Object>} A promise that resolves to the result of the database update operation.
 * @throws Will throw an error if the database query fails.
 */
const updateDemandState = async (id, state) => {
  const connection = await pool.getConnection();
  try {
    const updateDemandQuery = 'UPDATE demand SET state = ? WHERE id = ?';
    const [result] = await connection.execute(updateDemandQuery, [state, id]);
    if (result.affectedRows === 0) {
      throw { status: 404, message: 'Demand not found' };
    }
    logger.info('Demand state updated successfully.', { id, state });
    return result;
  } catch (error) {
    if (error.status === 404) {
      logger.info('Demand not found.', { id });
    } else {
      logger.error('Error updating demand state in the database.', {
        id,
        state,
        error,
      });
    }
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * @function getEmailAndLanguageByDemandId
 * @description Retrieves the email and language of the person associated with a demand.
 * @param {String} id - The ID of the demand to retrieve the email and language for.
 * @returns {Promise<Object>} A promise that resolves to the email and language of the person.
 * @throws Will throw an error if the database query fails.
 */
const getEmailAndLanguageByDemandId = async (id) => {
  const connection = await pool.getConnection();
  try {
    const query =
      'SELECT d.person_email AS email, p.language FROM demand d JOIN person p ON d.person_email = p.email WHERE d.id = ?';
    const [rows] = await connection.execute(query, [id]);
    return rows[0];
  } catch (error) {
    logger.error('Error fetching email and language from the database.', {
      id,
      error,
    });
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * @function deleteDemand
 * @description Deletes a demand from the database.
 * @param {String} id - The ID of the demand to delete.
 * @returns {Promise<void>}
 * @throws Will throw an error if the database query fails.
 */
const deleteDemand = async (id) => {
  const connection = await pool.getConnection();
  try {
    const deleteDemandQuery = 'DELETE FROM demand WHERE id = ?';
    const [result] = await connection.execute(deleteDemandQuery, [id]);
    if (result.affectedRows === 0) {
      throw { status: 404, message: 'Demand not found' };
    }
    logger.info('Demand deleted successfully.', { demandId: id });
  } catch (error) {
    logger.error('Error deleting demand from the database.', { id, error });
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  getSectors,
  getPrices,
  saveDemand,
  getDemandsList,
  getDemandById,
  getAllDemandsDetails,
  updateDemandState,
  getEmailAndLanguageByDemandId,
  deleteDemand,
};
