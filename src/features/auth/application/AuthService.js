import { withErrorHandling } from '../../../shared/lib/errorHandler';
import { logError } from '../../../shared/lib/logger';
import {
  changePasswordUseCase,
  loginUseCase,
  logoutUseCase,
  registerUseCase,
  resetPasswordUseCase,
} from './authUseCases';

class AuthService {
  static login = withErrorHandling(async (email, password) => {
    return loginUseCase(email, password);
  }, 'AuthService.login');

  static register = withErrorHandling(async (userDataOrEmail, password) => {
    return registerUseCase(userDataOrEmail, password);
  }, 'AuthService.register');

  static resetPassword = withErrorHandling(async (email) => {
    return resetPasswordUseCase(email);
  }, 'AuthService.resetPassword');

  static changePassword = withErrorHandling(async (newPassword) => {
    return changePasswordUseCase(newPassword);
  }, 'AuthService.changePassword');

  static async logout() {
    try {
      await logoutUseCase();
    } catch (error) {
      logError('Erreur de déconnexion', error, {
        feature: 'auth',
        action: 'logout',
      });
      throw error;
    }
  }
}

export { AuthService };
