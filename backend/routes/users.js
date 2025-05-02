const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const db = require('../services/database');
const { validateExamForm } = require('../middlewares/formValidator');
const isAuthenticated = require('../middlewares/isAuthenticated');

// Route pour récupérer la liste des utilisateurs d'une classe, et leur score
router.get('/class', isAuthenticated, async (req, res) => {
  try {
    // Récupérer la liste des utilisateurs d'une classe
    const users = await db.getUsersByClassId(req.user.classId);

    if (!users) {
      return res.status(404).json({ error: 'Class not found' });
    }

    return res.status(200).json(users);
  } catch (error) {
    logger.error('' + error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
