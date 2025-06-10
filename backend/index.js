// Create an express app
const express = require('express');
const app = express();
app.use(express.json());
const cors = require('cors');
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8080',
  'https://example.com', // Remplace par ton URL réelle
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
  ],
};

app.use(cors(corsOptions));

const environment = process.env.NODE_ENV || 'development';
require('dotenv').config({ path: `.env.${environment}` });

const port = process.env.PORT || 3000;

app.use('/auth', require('./routes/auth.js'));
app.use('/exams', require('./routes/exams.js'));
app.use('/bets', require('./routes/bets.js'));
app.use('/results', require('./routes/results.js'));
app.use('/users', require('./routes/users.js'));

const logger = require('./utils/logger');

app.listen(port, () => {
  logger.info('Starting the application');
});
