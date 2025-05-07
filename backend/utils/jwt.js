const jwt = require('jsonwebtoken');

/**
 * @function generateToken
 * @param {string} username - Le username de l'utilisateur pour créer le token.
 * @param {string} role - Le rôle de l'utilisateur (user/admin).
 * @returns {string} - Le token JWT signé.
 */
const generateToken = (name, username, email, role, score, classId) => {
  const payload = {
    name,
    username,
    email,
    role,
    score,
    classId,
  }; // Créer le payload avec les informations de l'utilisateur
  const secret = 'secret';
  const options = { expiresIn: '24h' };

  return jwt.sign(payload, secret, options); // Générer le token
};

function verifyToken(token) {
  return jwt.verify(token, "secret");
}

module.exports = { generateToken, verifyToken };
