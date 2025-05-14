const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const db = require('../services/database');
const {
  validateExamForm
} = require('../middlewares/formValidator');
const isAuthenticated = require('../middlewares/isAuthenticated');
const isAdmin = require('../middlewares/isAdmin');

// Route de connexion
router.post('/', isAdmin, validateExamForm, async (req, res) => {
  const { name, date } = req.body;
  const { classId } = req.user;

  try {
    // Créer un nouvel examen
    const newExam = {
      name,
      date,
      classId,
    };

    // Sauvegarder l'examen dans la base de données
    await db.createExam(newExam);

    return res.status(201).json({ message: 'Exam created successfully' });
  } catch (error) {
    logger.error("" + error);
    return res.status(500).json({ error: 'Internal server error' });
  }

});

// Route pour récupérer tous les examens à venir pour lesquels l'utilisateu n'a pas encore parié
router.get('/upcoming', isAuthenticated, async (req, res) => {
  const { username, classId } = req.user;

  try {
    // Récupérer tous les examens à venir pour lesquels l'utilisateur n'a pas encore parié
    const exams = await db.getUpcomingExams(username, classId);

    return res.status(200).json(exams);
  } catch (error) {
    logger.error("" + error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Route pour récupérer tous les examens passés mais qui n'ont pas encore de résultats
router.get('/past', isAuthenticated, async (req, res) => {
  const { username } = req.user;


  // convert classId to integer
  try {
    // Récupérer tous les examens passés mais qui n'ont pas encore de résultats
    const exams = await db.getPastExamsWithoutResults(username);

    return res.status(200).json(exams);
  } catch (error) {
    logger.error("" + error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;