const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const db = require('../services/database');
const {
  validateRegisterForm,
  validateLoginForm,
} = require('../middlewares/formValidator');
const { hash } = require('bcrypt');

const { compare } = require('bcryptjs');
const { generateToken, verifyToken } = require('../utils/jwt'); // Importe la fonction de génération du token

router.post('/register', validateRegisterForm, async (req, res) => {
  const { name, username, email, password, classId, className } = req.body;

  try {
    // Vérifier si le username existe déjà dans la base de données
    const existingUser = await db.getUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({ error: 'Username is already taken' });
    }

    // Vérifier si l'email existe déjà dans la base de données
    const existingEmail = await db.getUserByEmail(email);
    if (existingEmail) {
      return res.status(409).json({ error: 'Email is already registered' });
    }

    const newUser = {
      name,
      username,
      email,
      passwordHash: await hash(password, 10),
      role: '',
      classId: null,
    };

    if (classId) {
      newUser.classId = classId;
      newUser.role = 'user';
      // Vérifier si la classe existe déjà
      const existingClass = await db.getClassById(classId);
      if (!existingClass) {
        return res.status(400).json({ error: "Class doesn't exist" });
      }
    } else if (className) {
      newUser.classId = Math.floor(100000 + Math.random() * 900000).toString();
      await db.createClass(newUser.classId, className);
      newUser.role = 'admin';
    } else {
      return res
        .status(400)
        .json({ error: 'classId or className is required' });
    }

    // Sauvegarder l'utilisateur dans la base de données
    await db.createUser(newUser);

    // Générer le token JWT pour l'utilisateur créé
    const token = generateToken(
      newUser.name,
      newUser.username,
      newUser.email,
      newUser.role,
      '0',
      newUser.classId,
    );

    // Réponse avec le token et l'utilisateur créé
    logger.info(`User created: ${JSON.stringify(newUser)}`);
    res.status(201).json({ message: 'User created', user: newUser, token });
  } catch (err) {
    logger.error(`Error creating user: ${err.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route de connexion
router.post('/login', validateLoginForm, async (req, res) => {
  const { username, password } = req.body;

  try {
    // Chercher l'utilisateur par son username
    const user = await db.getUserByUsername(username);

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Comparer le mot de passe hashé avec celui envoyé par l'utilisateur
    const isPasswordValid = await compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Générer le token JWT
    const token = generateToken(
      user.name,
      user.username,
      user.email,
      user.role,
      user.score,
      user.id_classroom,
    );

    // Retourner le token au client
    res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    logger.error(`Error logging in: ${err.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/tokenvalidity', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token); // Vérifie la signature et l’expiration
    res.status(200).json(decoded); // Renvoie le payload
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

module.exports = router;
