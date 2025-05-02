// Create an express app
const express = require('express');
const app = express();
app.use(express.json());
const cors = require('cors');
const corsOptions = {
  origin: 'http://localhost:3000',
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

const port = process.env.APP_PORT;

app.use('/auth', require('./routes/auth.js'));
app.use('/exams', require('./routes/exams.js'));
app.use('/bets', require('./routes/bets.js'));
app.use('/results', require('./routes/results.js'));
app.use('/users', require('./routes/users.js'));

const logger = require('./utils/logger');

app.listen(port, () => {
  logger.info('Starting the application');
});
