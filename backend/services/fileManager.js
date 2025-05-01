const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');
const { parse } = require('json2csv');

/**
 * @function saveCarRegistrations
 * @description Saves car registration files to the server and updates the vehicle objects with the new file names.
 * @param {Array|String} vehicles - An array of vehicle objects or a JSON string of vehicle objects.
 * @param {String} id - The ID to be used in the new file names.
 * @param {Array} files - An array of file objects to be saved.
 * @returns {Promise<Array>} The updated array of vehicle objects with the new car registration file names.
 * @throws Will throw an error if the files cannot be saved.
 */
const saveCarRegistrations = async (vehicles, id, files) => {
  try {
    // If vehicles is a string, convert it to an array
    if (typeof vehicles === 'string') {
      vehicles = [vehicles];
    }

    // Parse any vehicle objects that are in JSON string format
    vehicles = vehicles.map((vehicle) =>
      typeof vehicle === 'string' ? JSON.parse(vehicle) : vehicle,
    );

    // If there are vehicles to process
    if (vehicles.length > 0) {
      // Map over the vehicles and save each car registration file
      vehicles = vehicles.map((vehicle, index) => {
        const file = files[index];
        const extension = file.originalname.split('.').pop();
        const newName = `${id}_${index + 1}.${extension}`;
        const newPath = path.join(process.env.CAR_REGISTRATIONS_PATH + newName);
        fs.writeFileSync(newPath, file.buffer);

        // Log the file save operation
        logger.info(`Saved car registration file: ${newName}`);

        // Return the updated vehicle object with the new car registration file name
        return {
          ...vehicle,
          carRegistration: newName,
        };
      });

      // Return the updated vehicles array
      return vehicles;
    }
  } catch (error) {
    // Log the error
    logger.error(`Error saving car registrations: ${error.message}`, { error });
    // Throw any errors that occur
    throw error;
  }
};

/**
 * @function deleteCarRegistrations
 * @description Deletes car registration files associated with a given ID from the server.
 * @param {String} id - The ID associated with the files to be deleted.
 */
const deleteCarRegistrations = (id) => {
  try {
    // Define the directory containing the files
    const directory = path.join(process.env.CAR_REGISTRATIONS_PATH);

    // Read all files in the directory
    const files = fs.readdirSync(directory);

    // Loop over the files and delete those that include the given ID
    files.forEach((file) => {
      if (file.includes(id)) {
        fs.unlinkSync(path.join(directory, file));
        // Log the file delete operation
        logger.info(`Deleted car registration file: ${file}`);
      }
    });
  } catch (error) {
    // Log the error
    logger.error(`Error deleting car registrations: ${error.message}`, {
      error,
    });
    // Throw any errors that occur
    throw error;
  }
};

/**
 * @function getFile
 * @description Retrieves a file based on the provided filename.
 * @param {String} filename - The name of the file to retrieve.
 * @returns {Object|null} The file object containing file path if found, or null if not found.
 */
const getFile = (filename) => {
  try {
    const filePath = path.join(process.env.CAR_REGISTRATIONS_PATH, filename);

    // Check if the file exists
    if (fs.existsSync(filePath)) {
      return { path: filePath };
    } else {
      logger.error('File not found.', { filename });
      return null;
    }
  } catch (error) {
    logger.error('Error retrieving file.', { filename, error });
    throw error;
  }
};

/**
 * @function generateCSVFile
 * @description Generates a CSV file from the provided data and saves it to the server.
 * @param {Array} data - The data to be included in the CSV file.
 * @param {String} fileName - The name of the CSV file to be saved.
 * @returns {String} The path to the saved CSV file.
 * @throws Will throw an error if the file cannot be saved.
 */
const generateCSVFile = (data, fileName) => {
  try {
    // Define the fields to include in the CSV file
    const fields = [
      'id',
      'date',
      'first_name',
      'last_name',
      'email',
      'phone',
      'address',
      'npa',
      'locality',
      'school',
      'sector',
      'percentage',
      'language',
      'period',
      'start_date',
      'number_of_months',
      'rules',
      'data_protection',
      'state',
      'vehicles',
      'occupants',
    ];

    // Modify the data to include the vehicle and occupant details
    const modifiedData = data.map((item) => ({
      ...item,
      date: new Date(item.date).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      start_date: new Date(item.start_date).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
      vehicles: item.vehicles
        .map(
          (v) =>
            `Plate: ${v.plate}, Car registration filename: ${v.car_registration}`,
        )
        .join('; '),
      occupants: item.occupants
        .map(
          (o) =>
            `First Name: ${o.first_name}, Last Name : ${o.last_name}, Address: ${o.address}, NPA: ${o.npa}, Locality: ${o.locality}`,
        )
        .join('; '),
    }));

    // Generate the CSV file
    const csv = parse(modifiedData, { fields, delimiter: ';', withBOM: true });
    const filePath = path.join(process.env.EXPORT_PATH, fileName);

    // Save the CSV file to the server
    fs.writeFileSync(filePath, csv);
    logger.info(`CSV file generated: ${filePath}`);

    return filePath;
  } catch (error) {
    logger.error('Error generating CSV file:', error);
    throw error;
  }
};

module.exports = {
  saveCarRegistrations,
  deleteCarRegistrations,
  getFile,
  generateCSVFile,
};
