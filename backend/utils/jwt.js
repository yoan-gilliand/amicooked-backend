const jwt = require('jsonwebtoken');

/**
 * @function generateToken
 * @param {string} username - Le username de l'utilisateur pour créer le token.
 * @param {string} role - Le rôle de l'utilisateur (user/admin).
 * @returns {string} - Le token JWT signé.
 */
const generateToken = (username, role) => {
  const payload = { username, role };
  const secret = 'secret';
  const options = { expiresIn: '24h' };

  return jwt.sign(payload, secret, options); // Générer le token
};

module.exports = { generateToken };
