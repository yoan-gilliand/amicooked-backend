const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer();
const { v4: uuidv4 } = require('uuid');

const { validateForm } = require('../middlewares/formValidator');
const db = require('../services/database');
const fileManager = require('../services/fileManager');
const mailSender = require('../services/mailSender');
const authMiddleware = require('../middlewares/authentication');
const fs = require('fs');
const logger = require('../utils/logger');

/**
 * @route POST /demand
 * @description Handles form submission by validating the form, saving the demand to the database, saving car registration files, and sending confirmation and alert emails.
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Object} JSON response with success or error message.
 */
router.post(
  '/',
  authMiddleware.isAuthenticated,
  upload.any(),
  validateForm,
  async (req, res) => {
    const id = uuidv4(); // Generate a unique ID for the demand

    logger.info('Received demand submission.', { id, email: req.body.email });

    try {
      // Save car registration files and update the vehicle data
      const vehicles = await fileManager.saveCarRegistrations(
        req.body.vehicles,
        id,
        req.files,
      );
      req.body.vehicles = vehicles;

      // Save the demand data to the database
      await db.saveDemand(req.body, id);

      // Send a confirmation email to the user
      await mailSender.sendDemandConfirmation(
        req.body.email,
        req.body.language,
      );

      // Send an alert email to the admin
      await mailSender.sendDemandAlert();

      // Respond with a success message
      res.status(200).json('Form submitted successfully!');
      logger.info('Form submitted successfully.', { id });
    } catch (error) {
      logger.error('Error during form submission.', { error, id });

      if (error.mailerError) {
        // Handle mailer error
        res.status(500).json({
          message: 'An error occurred while sending the emails.',
          appCode: 'MAILER_ERROR',
        });
        logger.error('Mailer error occurred.', { id, error });
      } else if (error.databaseError) {
        // Handle database error, delete saved files
        res.status(500).json('An error occurred while submitting the form.');
        await fileManager.deleteCarRegistrations(id);
        logger.error('Database error occurred. Car registrations deleted.', {
          id,
          error,
        });
      } else {
        // Handle general errors
        res.status(500).json('An error occurred while submitting the form.');
        logger.error('General error occurred.', { id, error });
      }
    }
  },
);

/**
 * @route GET /demand
 * @description Fetches demands list from the database.
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Object} JSON response with all demands.
 */
router.get(
  '/',
  authMiddleware.isAuthenticated,
  authMiddleware.isAdmin,
  async (req, res) => {
    logger.info('Fetching demands list.');
    try {
      const demands = await db.getDemandsList();
      res.status(200).json(demands);
      logger.info('Demands fetched successfully.');
    } catch (error) {
      res.status(500).json('An error occurred while fetching the demands.');
      logger.error('Error during demand fetching.', { error });
    }
  },
);

/**
 * @route GET /demand/download/:filename
 * @description Downloads a file by filename.
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Object} File download response.
 */
router.get(
  '/download/:filename',
  authMiddleware.isAuthenticated,
  authMiddleware.isAdmin,
  async (req, res) => {
    const filename = req.params.filename;
    logger.info('Downloading file.', { filename });
    try {
      const file = await fileManager.getFile(filename);
      if (!file) {
        res.status(404).json('File not found.');
        logger.error('File not found.', { filename });
        return;
      }
      res.status(200).download(file.path);
      logger.info('File downloaded successfully.', { filename });
    } catch (error) {
      res.status(500).json('An error occurred while downloading the file.');
      logger.error('Error during file download.', { filename, error });
    }
  },
);

/**
 * @route GET /demand/export
 * @description Generates a CSV file with all demands and downloads it.
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Object} File download response.
 */
router.get(
  '/export',
  authMiddleware.isAuthenticated,
  authMiddleware.isAdmin,
  async (req, res) => {
    logger.info('Generating CSV file with all demands.');
    try {
      const demands = await db.getAllDemandsDetails();

      // If no demands found, return 404
      if (!demands.length) {
        logger.info('No demands found.');
        return res.status(404).json({ message: 'No demands found.' });
      }

      // Generate file with current date
      const date = new Date().toISOString().slice(0, 10);
      const fileName = `demands-${date}.csv`;
      const filePath = fileManager.generateCSVFile(demands, fileName);

      // Download the file
      res.download(filePath, fileName, (err) => {
        if (err) {
          logger.error('Error downloading the file.', { fileName, err });
          return res.status(500).send('Error downloading the file.');
        }
        // Delete the file after download
        fs.unlinkSync(filePath);
        logger.info('File downloaded successfully.', { fileName });
      });
    } catch (err) {
      logger.error('Error generating CSV file.', { err });
      return res.status(500).json({ message: 'Error generating CSV file' });
    }
  },
);

/**
 * @route GET /demand/:id
 * @description Fetches a demand by ID from the database.
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Object} JSON response with the demand data.
 */

router.get(
  '/:id',
  authMiddleware.isAuthenticated,
  authMiddleware.isAdmin,
  async (req, res) => {
    const id = req.params.id;
    logger.info('Fetching demand.', { id });
    try {
      const demand = await db.getDemandById(id);
      if (!demand) {
        res.status(404).json('Demand not found.');
        logger.error('Demand not found.', { id });
        return;
      }
      res.status(200).json(demand);
      logger.info('Demand fetched successfully.', { id });
    } catch (error) {
      res.status(500).json('An error occurred while fetching the demand.');
      logger.error('Error during demand fetching.', { id, error });
    }
  },
);

/**
 * @route PUT /demand/:id
 * @description Updates the state of a demand by ID.
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Object} JSON response with success or error message.
 */
router.put(
  '/:id',
  authMiddleware.isAuthenticated,
  authMiddleware.isAdmin,
  async (req, res) => {
    // Get demand ID and state from the request
    const id = req.params.id;
    const state = req.body.state;

    // Check if state is missing
    if (!state) {
      logger.warn('State is missing in the request body.', { id });
      return res.status(400).json({ error: 'State is required.' });
    }
    logger.info('Updating demand.', { id });

    try {
      // Update the demand state in the database
      const updatedDemands = await db.updateDemandState(id, state);
      if (!updatedDemands) {
        throw { status: 404 };
      }
      // Get email and language of the user
      const emailAndLanguage = await db.getEmailAndLanguageByDemandId(id);

      // Send an alert email to the user
      await mailSender.sendUpdateAlert(emailAndLanguage, state);
      logger.info('Update alert email sent successfully.');

      // Send a success response to the client
      res.status(200).json('Demand updated successfully.');
      logger.info('Demand updated successfully.', { id });
    } catch (error) {
      logger.error('Error during demand update.', { error, id });
      if (error.mailerError) {
        // Handle mailer error
        res.status(500).json({
          message: 'An error occurred while sending the emails.',
          appCode: 'MAILER_ERROR',
        });
        logger.error('Mailer error occurred.', { id, error });
      } else if (error.status === 404) {
        // Handle demand not found
        res.status(404).json({ error: 'Demand not found.' });
        logger.error('Demand not found.', { id, error });
      } else {
        // Handle general errors
        res.status(500).json('An error occurred while updating the demand.');
        logger.error('General error occurred.', { id, error });
      }
    }
  },
);

/**
 * @route DELETE /demand/:id
 * @description Deletes a demand by ID from the database.
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Object} JSON response with success or error message.
 */
router.delete(
  '/:id',
  authMiddleware.isAuthenticated,
  authMiddleware.isAdmin,
  async (req, res) => {
    const id = req.params.id;
    logger.info('Deleting demand.', { id });
    try {
      // Delete the car registration files
      await fileManager.deleteCarRegistrations(id);

      // Delete the demand from the database
      await db.deleteDemand(id);

      // Send a success response to the client
      res.status(200).json('Demand deleted successfully.');
      logger.info('Demand deleted successfully.', { id });
    } catch (error) {
      logger.error('Error during demand deletion.', { error, id });
      if (error.status === 404) {
        // Handle demand not found
        res.status(404).json({ error: 'Demand not found.' });
        logger.error('Demand not found.', { id, error });
      } else {
        // Handle general errors
        res.status(500).json('An error occurred while deleting the demand.');
        logger.error('General error occurred.', { id, error });
      }
    }
  },
);

module.exports = router;
