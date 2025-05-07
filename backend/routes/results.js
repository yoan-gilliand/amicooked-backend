const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const db = require('../services/database');
const {
  validateBetForm, validateResultForm
} = require('../middlewares/formValidator');
const isAuthenticated = require('../middlewares/isAuthenticated');

// Route pour sauvegarder le résultat d'un examen
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

    // Sauvegarder le résultat de l'examen
    await db.createResult(newBet.examId, newBet.grade, newBet.username);

    // Récupérer le pari de l'utilisateur
    const bet = await db.getBetByExamIdAndUsername(newBet.examId, newBet.username);

    let scoreToAdd = 0;
    if (bet && bet.grade !== undefined && bet.grade !== null) {
      scoreToAdd = Math.max(0, 10 - Math.round(2 * Math.abs(bet.grade - newBet.grade)));
    }

    // Mettre à jour le score uniquement si scoreToAdd > 0
    if (scoreToAdd > 0) {
      await db.updateUserScore(username, score + scoreToAdd);
    }

    return res.status(201).json({ message: 'Result created successfully', score : scoreToAdd });
  } catch (error) {
    logger.error("" + error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;