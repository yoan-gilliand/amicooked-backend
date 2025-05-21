const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const db = require('../services/database');
const {
  validateBetForm
} = require('../middlewares/formValidator');
const isAuthenticated = require('../middlewares/isAuthenticated');

// Route de connexion
router.post('/', isAuthenticated, validateBetForm, async (req, res) => {
  const { examId, grade } = req.body;
  const { username } = req.user;

  try {
    // Créer un nouvel examen
    const newBet = {
      examId,
      grade,
      username,
    };

    // Sauvegarder le pari dans la base de données
    await db.createBet(newBet.examId, newBet.grade, newBet.username);

    return res.status(201).json({ message: 'Bet created successfully' });
  } catch (error) {
    logger.error("" + error);
    return res.status(500).json({ error: 'Internal server error' });
  }

});

module.exports = router;