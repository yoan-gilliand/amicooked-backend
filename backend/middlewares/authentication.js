const axios = require('axios');
const logger = require('../utils/logger');

// Create an axios instance
const instance = axios.create({
  baseURL: process.env.GATEWAY_URL,
  timeout: 3000,
});

/**
 * Middleware to check if the user is authenticated.
 * Validates the token by sending it to the authentication gateway.
 * Adds user information to the request object if valid.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {Object} - Returns a response with an error message if the token is invalid or missing.
 */
const isAuthenticated = async (req, res, next) => {
  logger.info('Checking if the user is authenticated');
  // Extract the Authorization header
  const authHeader = req.headers['authorization'];

  // Check if the Authorization header is present
  if (!authHeader) {
    logger.error('Access token is required');
    return res
      .status(401)
      .json({ error: 'Access token is required', appCode: 'AUTH_ERROR' });
  }

  // Extract the token from the Authorization header
  const token = authHeader.split(' ')[1];
  if (!token) {
    logger.error('Access token is required');
    return res
      .status(401)
      .json({ error: 'Access token is required', appCode: 'AUTH_ERROR' });
  }

  // Send a request to the authentication gateway to validate the token
  try {
    logger.info('Sending request to the authentication gateway');
    const response = await instance.get(
      '/auth/validity?app=' + process.env.GATEWAY_APP_NAME,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    // Get the response data, which contains the user information
    const { isValid, familyName, givenName, uniqueName, role } = response.data;

    // Check if the token is valid
    if (!isValid) {
      logger.error('Invalid token');
      return res
        .status(401)
        .json({ error: 'Invalid token.', appCode: 'AUTH_ERROR' });
    }

    // Attach the user information to the request object
    req.user = { familyName, givenName, uniqueName, role };
    logger.info('User is authenticated' + JSON.stringify(req.user));

    // Call the next middleware
    next();
  } catch (error) {
    if (error.response && error.response.status === 401) {
      logger.error('Invalid token');
      return res
        .status(401)
        .json({ error: 'Invalid token.', appCode: 'AUTH_ERROR' });
    }
    logger.error('Internal Server Error');
    return res
      .status(500)
      .json({ error: 'Internal Server Error', appCode: 'AUTH_ERROR' });
  }
};

/**
 * Middleware to check if the authenticated user is an admin.
 * Assumes that the user information is already attached to the request object by the isAuthenticated middleware.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {Object} - Returns a response with an error message if the user is not an admin.
 */
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    logger.error('Access forbidden: Admins only' + JSON.stringify(req.user));
    return res
      .status(403)
      .json({ error: 'Access forbidden: Admins only', appCode: 'AUTH_ERROR' });
  }
  next();
};

module.exports = { isAuthenticated, isAdmin };
