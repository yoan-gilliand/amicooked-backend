const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const db = require('../services/database');
const {
  validateBetForm, validateResultForm
} = require('../middlewares/formValidator');
const isAuthenticated = require('../middlewares/isAuthenticated');

// Route de connexion
router.post('/', isAuthenticated, validateResultForm, async (req, res) => {
  const { examId, grade } = req.body;
  const { username, score } = req.user;

  try {
    // Créer un nouvel examen
    const newBet = {
      examId,
      grade,
      username,
    };

    // Sauvegarder le pari dans la base de données
    await db.createResult(newBet.examId, newBet.grade, newBet.username);

    // Get the bet of the user on the specific exam
    const bet = await db.getBetByExamIdAndUsername(newBet.examId, newBet.username);

    // Calculate the scoreToAdd using this formula max(0, 10 - round(2 * abs(pari - resultat)))
    const scoreToAdd = Math.max(0, 10 - Math.round(2 * Math.abs(bet.grade - newBet.grade)));

    // Update the score of the user
    await db.updateUserScore(username, score + scoreToAdd);

    return res.status(201).json({ message: 'Result created successfully' });
  } catch (error) {
    logger.error("" + error);
    return res.status(500).json({ error: 'Internal server error' });
  }

});

module.exports = router;