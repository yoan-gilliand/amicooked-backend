const express = require('express');
const router = express.Router();
const db = require('../services/database');
const authMiddleware = require('../middlewares/authentication');
const logger = require('../utils/logger');

/**
 * @route GET /prices
 * @description Retrieves the latest prices from the database and sends them as a JSON response.
 * @returns {Object} JSON response containing the list of prices or an error message.
 */
router.get('/', authMiddleware.isAuthenticated, (req, res) => {
  logger.info('Received request for latest prices.');

  db.getPrices()
    .then((prices) => {
      // Send the list of prices as a JSON response
      res.json(prices);
      logger.info('Successfully retrieved and sent prices.', { prices });
    })
    .catch((error) => {
      // Log the error and send a 500 status with an error message
      logger.error('Error retrieving prices.', { error });
      res.status(500).json({ error: 'Internal error' });
    });
});

module.exports = router;
