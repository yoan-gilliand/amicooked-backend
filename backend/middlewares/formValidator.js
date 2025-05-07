const logger = require('../utils/logger');

// Helper function to generate error messages
const errorMsg = (message) => {
  return { error: true, message };
};

// Validation function for the name
const validateName = (name) => {
  if (!name) return errorMsg('Name is required');
  if (name.length > 100)
    return errorMsg('First name must be less than 100 characters');
  return null;
};

// Validation function for the username, can only contain alphanumeric characters, numbers, and underscores
const validateUsername = (username) => {
  if (!username) return errorMsg('Username is required');
  if (username.length > 50)
    return errorMsg('Username must be less than 50 characters');
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  if (!usernameRegex.test(username))
    return errorMsg(
      'Username can only contain letters, numbers, and underscores'
    );
  return null;
};

// Validation function for the email
const validateEmail = (email) => {
  if (!email) return errorMsg('Email is required');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email))
    return errorMsg('Email must be a valid email address');
  return null;
};

// Validation function for the password
const validatePassword = (password) => {
  if (!password) return errorMsg('Password is required');
  if (password.length < 8)
    return errorMsg('Password must be at least 8 characters long');
  return null;
};

// Validation function for the classId and className
const validateClass = (classId, className) => {
  if (!classId && !className)
    return errorMsg('Either classId or className must be present');
  if (classId && className)
    return errorMsg('Only one of classId or className must be present');
  return null;
};

// Validation function for the date
const validateDate = (date) => {
  if (!date) return errorMsg('Date is required');
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date))
    return errorMsg('Date must be in YYYY-MM-DD format');
  return null;
};

const validateRegisterForm = (req, res, next) => {
  const { name, username, email, password, classId, className } =
    req.body || {};

  // Validate each field
  const validators = [
    validateName(name),
    validateUsername(username),
    validateEmail(email),
    validatePassword(password),
    validateClass(classId, className),
  ];

  // Filter out null values (validations that passed)
  const errors = validators.filter((error) => error !== null);

  if (errors.length > 0) {
    logger.error(errors);
    return res.status(400).json({ errors });
  }

  next();
};

const validateLoginForm = (req, res, next) => {
  const { username, password } = req.body || {};

  // Validate each field
  const validators = [validateUsername(username), validatePassword(password)];

  // Filter out null values (validations that passed)
  const errors = validators.filter((error) => error !== null);

  if (errors.length > 0) {
    logger.error(errors);
    return res.status(400).json({ errors });
  }

  next();
};

const validateExamForm = (req, res, next) => {
  const { name, date } = req.body || {};

  // Validate each field
  const validators = [validateName(name), validateDate(date)];

  // Filter out null values (validations that passed)
  const errors = validators.filter((error) => error !== null);

  if (errors.length > 0) {
    logger.error(errors);
    return res.status(400).json({ errors });
  }

  next();
};


// Validation function for the examId
const validateBetId = (examId) => {
  if (!examId) return errorMsg('Exam ID is required');
  if (typeof examId !== 'number')
    return errorMsg('Exam ID must be a number');
  return null;
};

// Validation function for the grade
const validateGrade = (grade) => {
  if (!grade) return errorMsg('Grade is required');
  const gradeRegex = /^(?:[1-5](?:\.\d)?|6(?:\.0)?)$/;
  if (!gradeRegex.test(grade))
    return errorMsg('Grade must be between 1.0 and 6.0');
  return null;
};

const validateBetForm = (req, res, next) => {
  const { examId, grade } = req.body || {};

  // Validate each field
  const validators = [validateBetId(examId), validateGrade(grade)];

  // Filter out null values (validations that passed)
  const errors = validators.filter((error) => error !== null);

  if (errors.length > 0) {
    logger.error(errors);
    return res.status(400).json({ errors });
  }

  next();
}

const validateResultForm = (req, res, next) => {
  const { examId, grade } = req.body || {};

  // Validate each field
  const validators = [validateBetId(examId), validateGrade(grade)];

  // Filter out null values (validations that passed)
  const errors = validators.filter((error) => error !== null);

  if (errors.length > 0) {
    logger.error(errors);
    return res.status(400).json({ errors });
  }

  next();
}

module.exports = {
  validateRegisterForm,
  validateLoginForm,
  validateExamForm,
  validateBetForm,
  validateResultForm
};
