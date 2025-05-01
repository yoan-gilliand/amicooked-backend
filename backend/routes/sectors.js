const express = require('express');
const router = express.Router();
const db = require('../services/database');
const authMiddleware = require('../middlewares/authentication');
const logger = require('../utils/logger');

/**
 * @route GET /sectors
 * @description Retrieves all sectors from the database and sends them as a JSON response.
 * @returns {Object} JSON response containing the list of sectors or an error message.
 */
router.get('/', authMiddleware.isAuthenticated, (req, res) => {
  logger.info('Received request for sectors.');

  db.getSectors()
    .then((sectors) => {
      // Send the list of sectors as a JSON response
      res.json(sectors);
      logger.info('Successfully retrieved and sent sectors.', { sectors });
    })
    .catch((error) => {
      // Log the error and send a 500 status with an error message
      logger.error('Error retrieving sectors.', { error });
      res
        .status(500)
        .json({ error: 'An error occurred while retrieving sectors' });
    });
});

module.exports = router;
