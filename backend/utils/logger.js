const { createLogger, format } = require('winston');
const { combine, timestamp, prettyPrint } = format;
const DailyRotateFile = require('winston-daily-rotate-file');

const logger = createLogger({
  level: 'info',
  format: combine(timestamp(), prettyPrint()),
  /*transports: [
    new DailyRotateFile({
      filename:
        `${process.env.LOG_PATH}error-%DATE%.log` || 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      level: 'error',
    }),
    new DailyRotateFile({
      filename:
        `${process.env.LOG_PATH}combined-%DATE%.log` ||
        'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
    }),
  ],*/
});

module.exports = logger;
