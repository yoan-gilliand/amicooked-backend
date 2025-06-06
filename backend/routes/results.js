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

    // Récupérer le score actuel de l'utilisateur
    const user = await db.getUserByUsername(username);

    // Mettre à jour le score uniquement si scoreToAdd > 0
    if (user && scoreToAdd > 0) {
      await db.updateUserScore(username, user.score + scoreToAdd);
    }

    return res.status(201).json({ message: 'Result created successfully', score : scoreToAdd });
  } catch (error) {
    logger.error("" + error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Route pour récupérer tous les résultats d'un utilisateur
// Calculer le score obtenu en fonction du pronostic qui avait été effectué selon la formule Math.max(0, 10 - Math.round(2 * Math.abs(bet.grade - newBet.grade)));
// Retourner un tableau avec le score obtenu à l'examen, son nom et sa date
router.get('/score-evolution', isAuthenticated, async (req, res) => {
  const { username } = req.user;

  try {
    // Récupérer tous les résultats de l'utilisateur
    const results = await db.getResultsByUsername(username);

    if (!results || results.length === 0) {
      return res.status(404).json({ message: 'No results found for this user' });
    }

    // Trier les résultats par date croissante
    results.sort((a, b) => new Date(a.date) - new Date(b.date));


    // Calculer le score pour chaque résultat
    let totalScore = 0;
    const scores = results.map(result => {
      const bet = db.getBetByExamIdAndUsername(result.id, username);
      let score = 0;
      if (bet && bet.grade !== undefined && bet.grade !== null) {
        score = Math.max(0, 10 - Math.round(2 * Math.abs(bet.grade - result.grade)));
      }
      return {
        date: result.date,
        score: totalScore+= score,
      };
    });

    // Supprimer les doublons en fonction de la date en gardant le score le plus élevé
    const uniqueScores = [];
    const seenDates = new Set();
    scores.forEach(item => {
      if (!seenDates.has(item.date)) {
        seenDates.add(item.date);
        uniqueScores.push(item);
      } else {
        const existingItem = uniqueScores.find(i => i.date === item.date);
        if (item.score > existingItem.score) {
          existingItem.score = item.score;
        }
      }
    });


    return res.status(200).json(uniqueScores);
  } catch (error) {
    logger.error("" + error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Route pour récupérer un comparatif du pari/résultat de chaque examen
router.get('/comparative', isAuthenticated, async (req, res) => {
  const { username } = req.user;

  try {
    // Récupérer tous les résultats de l'utilisateur
    const results = await db.getResultsByUsername(username);

    if (!results || results.length === 0) {
      return res.status(404).json({ message: 'No results found for this user' });
    }

    // Trier les résultats par date croissante
    results.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculer le score pour chaque résultat
    const scores = results.map(result => {
      const bet = db.getBetByExamIdAndUsername(result.id, username);
      return {
        date: result.date,
        bet: bet ? bet.grade : 0,
        result: result.grade,
      };
    });

    return res.status(200).json(scores);
  } catch (error) {
    logger.error("" + error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get results distribution 1.0-2-0, 2.1-3.0, 3.1-4.0, 4.1-5.0, 5.1-6.0
router.get('/distribution', isAuthenticated, async (req, res) => {
  const { username } = req.user;

  try {
    // Récupérer tous les résultats de l'utilisateur
    const results = await db.getResultsByUsername(username);

    if (!results || results.length === 0) {
      return res.status(404).json({ message: 'No results found for this user' });
    }

    // Trier les résultats par date croissante
    results.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculer la distribution des résultats
    const distribution = {
      '1.0-2.0': 0,
      '2.1-3.0': 0,
      '3.1-4.0': 0,
      '4.1-5.0': 0,
      '5.1-6.0': 0,
    };

    results.forEach(result => {
      if (result.grade >= 1 && result.grade <= 2) {
        distribution['1.0-2.0']++;
      } else if (result.grade > 2 && result.grade <= 3) {
        distribution['2.1-3.0']++;
      } else if (result.grade > 3 && result.grade <= 4) {
        distribution['3.1-4.0']++;
      } else if (result.grade > 4 && result.grade <= 5) {
        distribution['4.1-5.0']++;
      } else if (result.grade > 5 && result.grade <= 6) {
        distribution['5.1-6.0']++;
      }
    });

    return res.status(200).json(distribution);
  } catch (error) {
    logger.error("" + error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Rotue pour récupérer le nombre de paris d'un utilisateur, le nombre de résultats entrés ainsi que le nombre de prédictions exactes
router.get('/stats', isAuthenticated, async (req, res) => {
  const { username } = req.user;

  try {
    // Récupérer le nombre de paris de l'utilisateur
    const betsCount = await db.getBetCountByUsername(username);

    // Récupérer le nombre de résultats de l'utilisateur
    const resultsCount = await db.getResultCountByUsername(username);

    // Récupérer le nombre de paris exacts
    const exactBetsCount = await db.getExactBetCountByUsername(username);

    return res.status(200).json({
      betsCount,
      resultsCount,
      exactBetsCount,
    });
  } catch (error) {
    logger.error("" + error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;