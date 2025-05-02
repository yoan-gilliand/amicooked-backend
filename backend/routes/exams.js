const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const db = require('../services/database');
const {
  validateExamForm
} = require('../middlewares/formValidator');
const isAdmin = require('../middlewares/isAuthenticated');

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

module.exports = router;