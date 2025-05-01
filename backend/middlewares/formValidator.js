const db = require('../services/database');
const logger = require('../utils/logger');

// Define validation lists for schools and sectors
const schoolsList = [];
const sectorsList = [];
db.getSectors().then((sectors) => {
  sectors.forEach((sector) => {
    if (!schoolsList.includes(sector.school_name)) {
      schoolsList.push(sector.school_name);
    }
    sectorsList.push(sector.key);
  });
});

// Define a list of acceptable periods
const periodsList = ['monthly', 'yearly'];

// Define a list of allowed file types for car registrations
const allowedFileTypesList = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
];

// Variable to store the last price year
let lastPriceYear = null;

// Fetch the list of prices from the database
db.getPrices().then((prices) => {
  lastPriceYear = prices[0].year;
});

// Define a list of supported languages
const languagesList = ['fr'];

// Helper function to generate error messages
const errorMsg = (message) => {
  return { error: true, message };
};

// Validation function for the first name
const validateFirstName = (firstName) => {
  if (!firstName) return errorMsg('First name is required');
  if (firstName.length > 50)
    return errorMsg('First name must be less than 50 characters');
  return null;
};

// Validation function for the last name
const validateLastName = (lastName) => {
  if (!lastName) return errorMsg('Last name is required');
  if (lastName.length > 50)
    return errorMsg('Last name must be less than 50 characters');
  return null;
};

// Validation function for the email
const validateEmail = (email) => {
  if (!email) return errorMsg('Email is required');
  if (!/.+@.+\..+/.test(email)) return errorMsg('Email must be valid');
  if (email.length > 254)
    return errorMsg('Email must be less than 254 characters');
  if (!/@hefr.ch$/.test(email) && !/@edu.hefr.ch$/.test(email))
    return errorMsg('Email must be in the form of @hefr.ch or @edu.hefr.ch');
  return null;
};

// Validation function for the phone number
const validatePhone = (phone) => {
  if (!phone) return errorMsg('Phone is required');
  if (!/^\d{10}$/.test(phone)) return errorMsg('Phone must be valid');
  return null;
};

// Validation function for the NPA (postal code)
const validateNPA = (npa) => {
  if (!npa) return errorMsg('NPA is required');
  if (npa.length !== 4 || isNaN(npa) || npa < 1000 || npa > 9999)
    return errorMsg('NPA must be valid');
  return null;
};

// Validation function for the address
const validateAddress = (address) => {
  if (!address) return errorMsg('Address is required');
  if (address.length > 60)
    return errorMsg('Address must be less than 60 characters');
  return null;
};

// Validation function for the locality
const validateLocality = (locality) => {
  if (!locality) return errorMsg('Locality is required');
  if (locality.length > 30)
    return errorMsg('Locality must be less than 30 characters');
  return null;
};

// Validation function for the school
const validateSchool = (school) => {
  if (!school) return errorMsg('School is required');
  if (!schoolsList.includes(school)) return errorMsg('School must be valid');
  return null;
};

// Validation function for the sector
const validateSector = (sector) => {
  if (!sector) return errorMsg('Sector is required');
  if (!sectorsList.includes(sector)) return errorMsg('Sector must be valid');
  return null;
};

// Validation function for the work percentage
const validatePercentage = (percentage) => {
  if (!percentage) return errorMsg('Percentage is required');
  if (percentage < 0 || percentage > 100)
    return errorMsg('Percentage must be between 0 and 100');
  return null;
};

// Validation function for the vehicles
const validateVehicles = (vehicles, files) => {
  if (!vehicles) return errorMsg('Vehicles are required');
  if (vehicles.length !== files.length)
    return errorMsg('Each vehicle must have a plate and a car registration');
  if (vehicles.length > 2) return errorMsg('Max 2 vehicles are allowed');
  return null;
};

// Validation function for the vehicle plate
const validatePlate = (plate) => {
  if (!plate) return errorMsg('Plate is required');
  if (!/^[A-Z]{2}\d{1,7}$/.test(plate)) return errorMsg('Plate must be valid');
  return null;
};

// Validation function for the car registration file
const validateCarRegistration = (carRegistration) => {
  if (!carRegistration) return errorMsg('Car registration is required');
  if (!allowedFileTypesList.includes(carRegistration.mimetype))
    return errorMsg('Car registration must be valid');
  return null;
};

// Validation function for the period
const validatePeriod = (period) => {
  if (!period) return errorMsg('Period is required');
  if (!periodsList.includes(period)) return errorMsg('Period must be valid');
  return null;
};

// Validation function for the start date based on the period
const validateStartDate = (period, startDate) => {
  if (period === 'monthly') {
    if (!startDate) return errorMsg('Start date is required');
    const validDates = [];
    const today = new Date();
    for (let i = 1; i <= 12; i++) {
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + i, 2);
      const formattedDate = nextMonth.toISOString().split('T')[0];
      validDates.push(formattedDate);
    }
    if (!validDates.includes(startDate)) {
      return errorMsg(
        'Start date must be the first day of any of the next 12 months',
      );
    }
    return null;
  } else {
    // For yearly period, start date must be the 01-01 of next year
    if (startDate !== new Date().getFullYear() + 1 + '-01-01')
      return errorMsg('Start date must be the first day of next year');
  }
  return null;
};

// Validation function for the duration in months based on the period and start date
const validateDurationInMonths = (period, startDate, durationInMonths) => {
  if (period === 'monthly') {
    if (!startDate) {
      return errorMsg('Start date is required for monthly subscription');
    }
    const today = new Date();
    const startDateObj = new Date(startDate);

    if (startDateObj < today) {
      return errorMsg('Start date must be in the future or today');
    }
    const diffInMonths =
      (startDateObj.getFullYear() - today.getFullYear()) * 12 +
      (startDateObj.getMonth() - today.getMonth());
    const maxDuration = 12 - diffInMonths + 1;
    if (durationInMonths < 1 || durationInMonths > maxDuration) {
      return errorMsg(
        `Duration must be between 1 and ${maxDuration} months for monthly subscription that starts on ${startDate}`,
      );
    }
  } else {
    durationInMonths = parseInt(durationInMonths);
    if (durationInMonths !== 12) {
      return errorMsg('Duration must be 12 months for yearly subscription');
    }
  }
  return null;
};

// Validation function for accepting general conditions
const validateRules = (rules) => {
  if (!rules) return errorMsg('Rules must be accepted');
  return null;
};

// Validation function for accepting data protection
const validateDataProtection = (dataProtection) => {
  if (!dataProtection) return errorMsg('Data protection must be accepted');
  return null;
};

// Validation function for the price year
const validatePriceYear = (priceYear) => {
  priceYear = parseInt(priceYear);
  if (!priceYear) return errorMsg('Price per year is required');
  if (priceYear !== lastPriceYear) return errorMsg('Price per year must valid');
  return null;
};

// Validation function for the language
const validateLanguage = (language) => {
  if (!language) return errorMsg('Language is required');
  if (!languagesList.includes(language))
    return errorMsg('Language must be valid');
  return null;
};

/**
 * @function validateForm
 * @description Validates the entire form data, checking all fields and their respective rules.
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @param {Function} next - The next middleware function.
 * @returns {Object} JSON response with errors if validation fails, otherwise proceeds to next middleware.
 */
const validateForm = (req, res, next) => {
  const form = req.body;
  const carRegistrations = req.files;

  let vehicles = form.vehicles;

  // Handle cases where vehicles is a single string
  if (typeof vehicles === 'string') {
    vehicles = [vehicles];
  }

  // Validate each vehicle's plate and collect any errors
  const vehicleErrors = vehicles
    .map((vehicle) => validatePlate(JSON.parse(vehicle).plate))
    .filter((error) => error !== null);

  // Validate each car registration file and collect any errors
  const carRegistrationErrors = carRegistrations
    .map((carRegistration) => validateCarRegistration(carRegistration))
    .filter((error) => error !== null);

  let occupantsErrors = [];
  if (form.occupants) {
    if (typeof form.occupants === 'string') {
      form.occupants = [form.occupants];
    }
    // For each occupant, validate first name, last name, address, NPA, and locality
    occupantsErrors = form.occupants
      .map((occupant) => {
        const parsedOccupant = JSON.parse(occupant);
        return [
          validateFirstName(parsedOccupant.firstName),
          validateLastName(parsedOccupant.lastName),
          validateAddress(parsedOccupant.address),
          validateNPA(parsedOccupant.npa),
          validateLocality(parsedOccupant.locality),
        ];
      })
      .flat()
      .filter((error) => error !== null);
  }

  // Collect all validation errors
  const errors = [
    validateFirstName(form.firstName),
    validateLastName(form.lastName),
    validateEmail(form.email),
    validatePhone(form.phone),
    validateNPA(form.npa),
    validateAddress(form.address),
    validateLocality(form.locality),
    validateSchool(form.school),
    validateSector(form.sector),
    validatePercentage(form.workPercentage),
    validateVehicles(vehicles, carRegistrations),
    ...vehicleErrors,
    ...carRegistrationErrors,
    ...occupantsErrors,
    validatePeriod(form.period),
    validateStartDate(form.period, form.startDate),
    validateDurationInMonths(
      form.period,
      form.startDate,
      form.durationInMonths,
    ),
    validateRules(form.rules),
    validateDataProtection(form.dataProtection),
    validatePriceYear(form.priceYear),
    validateLanguage(form.language),
  ].filter((error) => error !== null);

  // If there are validation errors, log and return them in the response with a 400 status code
  if (errors.length > 0) {
    logger.warn('Validation failed with errors for ' + form.email + '.', {
      errors,
    });
    return res.status(400).json({ errors });
  } else {
    // If no errors, proceed to the next middleware or route handler
    logger.info('Form validation passed for ' + form.email + '.');
    next();
  }
};

// Export the validateForm function to make it available for use in other files
module.exports = { validateForm };
