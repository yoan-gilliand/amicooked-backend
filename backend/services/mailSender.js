const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

/**
 * @function loadTranslations
 * @description Loads translation files from the '../mailTexts' directory.
 * @returns {Object} An object containing translations keyed by language.
 */
const loadTranslations = () => {
  const translations = {};
  const translationsPath = path.join(__dirname, '../mailTexts');

  try {
    const files = fs.readdirSync(translationsPath);
    files.forEach((file) => {
      const lang = path.basename(file, path.extname(file));
      translations[lang] = require(path.join(translationsPath, file));
    });
    logger.info('Mail translations loaded successfully.');
  } catch (error) {
    logger.error('Error loading mail translations', { error });
    throw error;
  }

  return translations;
};

// Load the translations
const translations = loadTranslations();

// Create a transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.MAILER_HOST,
  port: process.env.MAILER_PORT,
  secure: true, // use SSL
  auth: {
    user: process.env.MAILER_USER,
    pass: process.env.MAILER_PASSWORD,
  },
});

/**
 * @function sendDemandConfirmation
 * @description Sends a demand confirmation email.
 * @param {string} email - The recipient's email address.
 * @param {string} language - The language code for the email content.
 * @throws Will throw an error if the email could not be sent.
 */
const sendDemandConfirmation = async (email, language) => {
  try {
    const translation = translations[language];

    await transporter.sendMail({
      from: process.env.MAILER_USER,
      to: email,
      subject: translation.mail.demandConfirmationSubject,
      text: translation.mail.demandConfirmationText,
    });

    logger.info('Demand confirmation email sent successfully.', { email });
  } catch (error) {
    logger.error('Error sending demand confirmation email', {
      email,
      language,
      error,
    });
    error.mailerError = true;
    throw error;
  }
};

/**
 * @function sendDemandAlert
 * @description Sends an alert email for a new demand.
 * @throws Will throw an error if the email could not be sent.
 */
const sendDemandAlert = async () => {
  try {
    const translation = translations[process.env.TS_LANGUAGE];

    await transporter.sendMail({
      from: process.env.MAILER_USER,
      to: process.env.TS_EMAIL,
      subject: translation.mail.newDemandSubject,
      text: translation.mail.newDemandText,
    });

    logger.info('Demand alert email sent successfully.');
  } catch (error) {
    logger.error('Error sending demand alert email', { error });
    error.mailerError = true;
    throw error;
  }
};

/**
 * @function sendUpdateAlert
 * @description Sends an alert email for a demand state update.
 * @param emailAndLanguage - The email and language of the user.
 * @param state - The new state of the demand.
 * @throws Will throw an error if the email could not be sent.
 */
const sendUpdateAlert = async (emailAndLanguage, state) => {
  try {
    const translation = translations[emailAndLanguage.language];

    await transporter.sendMail({
      from: process.env.MAILER_USER,
      to: emailAndLanguage.email,
      subject: translation.mail.updateSubject,
      text: translation.mail.update[`${state}Text`],
    });

    logger.info('Update alert email sent successfully.', {
      email: emailAndLanguage.email,
      state,
    });
  } catch (error) {
    logger.error('Error sending update alert email', {
      email: emailAndLanguage.email,
      state,
      error,
    });
    error.mailerError = true;
    throw error;
  }
};

module.exports = { sendDemandConfirmation, sendDemandAlert, sendUpdateAlert };
