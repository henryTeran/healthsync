import { ValidationError } from './errorHandler';

// Schémas de validation
export const validationSchemas = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Format d\'email invalide'
  },
  password: {
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    message: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial'
  },
  phone: {
    pattern: /^(\+33|0)[1-9](\d{8})$/,
    message: 'Numéro de téléphone français invalide'
  },
  postalCode: {
    pattern: /^\d{5}$/,
    message: 'Code postal invalide (5 chiffres requis)'
  },
  medicalLicense: {
    pattern: /^[0-9]{11}$/,
    message: 'Numéro de licence médicale invalide'
  }
};

// Fonction de validation générique
export const validate = (value, schema, fieldName) => {
  if (!value && schema.required) {
    throw new ValidationError(`${fieldName} est requis`, fieldName);
  }

  if (value && schema.minLength && value.length < schema.minLength) {
    throw new ValidationError(`${fieldName} doit contenir au moins ${schema.minLength} caractères`, fieldName);
  }

  if (value && schema.maxLength && value.length > schema.maxLength) {
    throw new ValidationError(`${fieldName} ne peut pas dépasser ${schema.maxLength} caractères`, fieldName);
  }

  if (value && schema.pattern && !schema.pattern.test(value)) {
    throw new ValidationError(schema.message || `Format de ${fieldName} invalide`, fieldName);
  }

  return true;
};

// Validation des données utilisateur
export const validateUserData = (userData, userType) => {
  const errors = [];

  try {
    validate(userData.email, { ...validationSchemas.email, required: true }, 'Email');
    validate(userData.firstName, { required: true, minLength: 2, maxLength: 50 }, 'Prénom');
    validate(userData.lastName, { required: true, minLength: 2, maxLength: 50 }, 'Nom');
    validate(userData.mobileNumber, validationSchemas.phone, 'Téléphone');
    validate(userData.postalCode, validationSchemas.postalCode, 'Code postal');

    if (userType === 'doctor') {
      validate(userData.medicalLicense, { ...validationSchemas.medicalLicense, required: true }, 'Licence médicale');
    }

    // Validation de l'âge
    if (userData.age && (userData.age < 0 || userData.age > 150)) {
      errors.push(new ValidationError('Âge invalide', 'age'));
    }

  } catch (error) {
    errors.push(error);
  }

  if (errors.length > 0) {
    throw new ValidationError(`Erreurs de validation: ${errors.map(e => e.message).join(', ')}`);
  }

  return true;
};

// Validation des médicaments
export const validateMedication = (medication) => {
  const errors = [];

  try {
    validate(medication.name, { required: true, minLength: 2, maxLength: 100 }, 'Nom du médicament');
    validate(medication.dosage, { required: true, minLength: 1, maxLength: 50 }, 'Dosage');
    validate(medication.frequency, { required: true, minLength: 1, maxLength: 50 }, 'Fréquence');
    validate(medication.duration, { required: true, minLength: 1, maxLength: 50 }, 'Durée');
  } catch (error) {
    errors.push(error);
  }

  if (errors.length > 0) {
    throw new ValidationError(`Erreurs de validation du médicament: ${errors.map(e => e.message).join(', ')}`);
  }

  return true;
};

// Sanitisation des données
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Supprime les scripts
    .replace(/[<>]/g, '') // Supprime les balises HTML
    .substring(0, 1000); // Limite la longueur
};

// Validation des dates
export const validateDate = (date, fieldName = 'Date') => {
  const dateObj = new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    throw new ValidationError(`${fieldName} invalide`, fieldName);
  }

  return true;
};