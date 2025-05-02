const jwt = require('jsonwebtoken');

const isAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, "secret");

    if (!decoded.role || decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Access forbidden: Admins only.' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    return res.status(400).json({ error: 'Invalid token.' });
  }
};

module.exports = isAdmin;
