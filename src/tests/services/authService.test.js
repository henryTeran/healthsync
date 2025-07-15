import { AuthService } from '../../services/authService';
import { auth, db } from '../../config/firebase';
import { ValidationError, AuthError } from '../../utils/errorHandler';

// Mock Firebase
jest.mock('../../config/firebase', () => ({
  auth: {
    currentUser: null
  },
  db: {}
}));

jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  sendEmailVerification: jest.fn()
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn()
}));

import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockUser = { uid: 'test-uid', email: 'test@example.com' };
      signInWithEmailAndPassword.mockResolvedValue({ user: mockUser });

      const result = await AuthService.login('test@example.com', 'password123');

      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        auth, 
        'test@example.com', 
        'password123'
      );
      expect(result).toEqual(mockUser);
    });

    it('should throw ValidationError for missing credentials', async () => {
      await expect(AuthService.login('', 'password'))
        .rejects.toThrow(ValidationError);
      
      await expect(AuthService.login('email@test.com', ''))
        .rejects.toThrow(ValidationError);
    });

    it('should throw AuthError for invalid credentials', async () => {
      signInWithEmailAndPassword.mockRejectedValue({ 
        code: 'auth/invalid-credential' 
      });

      await expect(AuthService.login('test@example.com', 'wrongpassword'))
        .rejects.toThrow(AuthError);
    });

    it('should throw AuthError for too many requests', async () => {
      signInWithEmailAndPassword.mockRejectedValue({ 
        code: 'auth/too-many-requests' 
      });

      await expect(AuthService.login('test@example.com', 'password'))
        .rejects.toThrow(AuthError);
    });
  });

  describe('register', () => {
    const validUserData = {
      email: 'test@example.com',
      password: 'Password123!',
      firstName: 'John',
      lastName: 'Doe',
      type: 'patient',
      mobileNumber: '0123456789',
      postalCode: '75001',
      age: 30,
      gender: 'male',
      address: '123 Rue Test',
      state: 'Paris',
      country: 'France'
    };

    it('should register successfully with valid data', async () => {
      const mockUser = { uid: 'test-uid' };
      createUserWithEmailAndPassword.mockResolvedValue({ user: mockUser });
      sendEmailVerification.mockResolvedValue();
      setDoc.mockResolvedValue();

      const result = await AuthService.register(validUserData);

      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        auth,
        validUserData.email,
        validUserData.password
      );
      expect(sendEmailVerification).toHaveBeenCalledWith(mockUser);
      expect(setDoc).toHaveBeenCalled();
      expect(result).toBe('test-uid');
    });

    it('should throw ValidationError for invalid email', async () => {
      const invalidData = { ...validUserData, email: 'invalid-email' };

      await expect(AuthService.register(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw AuthError for existing email', async () => {
      createUserWithEmailAndPassword.mockRejectedValue({ 
        code: 'auth/email-already-in-use' 
      });

      await expect(AuthService.register(validUserData))
        .rejects.toThrow(AuthError);
    });

    it('should require medical license for doctors', async () => {
      const doctorData = { 
        ...validUserData, 
        type: 'doctor',
        medicalLicense: undefined 
      };

      await expect(AuthService.register(doctorData))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('resetPassword', () => {
    it('should send reset email successfully', async () => {
      sendPasswordResetEmail.mockResolvedValue();

      await AuthService.resetPassword('test@example.com');

      expect(sendPasswordResetEmail).toHaveBeenCalledWith(
        auth, 
        'test@example.com'
      );
    });

    it('should throw ValidationError for missing email', async () => {
      await expect(AuthService.resetPassword(''))
        .rejects.toThrow(ValidationError);
    });

    it('should throw AuthError for non-existent user', async () => {
      sendPasswordResetEmail.mockRejectedValue({ 
        code: 'auth/user-not-found' 
      });

      await expect(AuthService.resetPassword('nonexistent@example.com'))
        .rejects.toThrow(AuthError);
    });
  });
});