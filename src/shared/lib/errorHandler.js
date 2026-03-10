import toast from 'react-hot-toast';

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
  console.error(`[${context}] Erreur:`, error);

  // Log pour le monitoring (à remplacer par un service de logging)
  if (import.meta.env.VITE_NODE_ENV === 'production') {
    // Envoyer à un service de monitoring comme Sentry
    console.error('Production Error:', {
      message: error.message,
      code: error.code,
      context,
      timestamp: new Date().toISOString(),
      stack: error.stack
    });
  }

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