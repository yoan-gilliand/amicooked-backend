// Create an express app
const express = require('express');
const app = express();
app.use(express.json());
const cors = require('cors');
app.use(cors());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, withCredentials',
  );
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

const environment = process.env.NODE_ENV || 'development';
require('dotenv').config({ path: `.env.${environment}` });

const port = process.env.APP_PORT;

app.use('/users', require('./routes/users.js'));
app.use('/exams', require('./routes/exams.js'));
app.use('/bets', require('./routes/bets.js'));
app.use('/results', require('./routes/results.js'));

const logger = require('./utils/logger');

app.listen(port, () => {
  logger.info('Starting the application');
});
