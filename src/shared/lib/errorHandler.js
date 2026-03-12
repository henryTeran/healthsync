import toast from 'react-hot-toast';
import { logError } from './logger';
import { ERROR_CODES } from './errorCodes';

export class AppError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR', statusCode = 500) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
  }
}

export class ValidationError extends AppError {
  constructor(message, field = null) {
    super(message, 'VALIDATION_ERROR', 400);
    this.field = field;
  }
}

export class AuthError extends AppError {
  constructor(message) {
    super(message, 'AUTH_ERROR', 401);
  }
}

export class PermissionError extends AppError {
  constructor(message) {
    super(message, 'PERMISSION_ERROR', 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource) {
    super(`${resource} non trouvé`, 'NOT_FOUND', 404);
  }
}

// Gestionnaire global d'erreurs
export const handleError = (error, context = '') => {
  logError('Unhandled application error', error, {
    code: ERROR_CODES.APP.RUNTIME,
    feature: 'global',
    context,
    originalCode: error?.code,
    statusCode: error?.statusCode,
    timestamp: new Date().toISOString(),
  });

  // Affichage utilisateur
  if (error instanceof ValidationError) {
    toast.error(`Erreur de validation: ${error.message}`);
  } else if (error instanceof AuthError) {
    toast.error('Erreur d\'authentification. Veuillez vous reconnecter.');
  } else if (error instanceof PermissionError) {
    toast.error('Vous n\'avez pas les permissions nécessaires.');
  } else if (error instanceof NotFoundError) {
    toast.error(error.message);
  } else {
    toast.error('Une erreur inattendue s\'est produite. Veuillez réessayer.');
  }

  return error;
};

// Wrapper pour les fonctions async
export const withErrorHandling = (fn, context = '') => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      throw handleError(error, context);
    }
  };
};