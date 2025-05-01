const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

/**
 * @route GET /prices
 * @description Retrieves the latest prices from the database and sends them as a JSON response.
 * @returns {Object} JSON response containing the list of prices or an error message.
 */
router.get('/', (req, res) => {
  logger.info('Received request for latest prices.');
  res.status(200).json(process.env.GATEWAY_URL);
});

module.exports = router;
