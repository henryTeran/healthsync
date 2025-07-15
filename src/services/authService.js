import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updatePassword,
  sendEmailVerification
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { handleError, AuthError, ValidationError } from '../utils/errorHandler';
import { validateUserData, sanitizeInput } from '../utils/validation';
import { withErrorHandling } from '../utils/errorHandler';

class AuthService {
  // Connexion
  static login = withErrorHandling(async (email, password) => {
    if (!email || !password) {
      throw new ValidationError('Email et mot de passe requis');
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      if (error.code === 'auth/invalid-credential') {
        throw new AuthError('Email ou mot de passe incorrect');
      } else if (error.code === 'auth/too-many-requests') {
        throw new AuthError('Trop de tentatives. Réessayez plus tard.');
      }
      throw new AuthError('Erreur de connexion');
    }
  }, 'AuthService.login');

  // Inscription
  static register = withErrorHandling(async (userData) => {
    // Validation des données
    validateUserData(userData, userData.type);

    // Sanitisation
    const sanitizedData = {
      ...userData,
      firstName: sanitizeInput(userData.firstName),
      lastName: sanitizeInput(userData.lastName),
      address: sanitizeInput(userData.address),
      state: sanitizeInput(userData.state),
      country: sanitizeInput(userData.country)
    };

    try {
      // Création du compte Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        sanitizedData.email, 
        sanitizedData.password
      );

      // Envoi de l'email de vérification
      await sendEmailVerification(userCredential.user);

      // Sauvegarde du profil dans Firestore
      const userProfile = {
        firstName: sanitizedData.firstName,
        lastName: sanitizedData.lastName,
        email: sanitizedData.email,
        type: sanitizedData.type,
        age: sanitizedData.age,
        gender: sanitizedData.gender,
        mobileNumber: sanitizedData.mobileNumber,
        address: sanitizedData.address,
        postalCode: sanitizedData.postalCode,
        state: sanitizedData.state,
        country: sanitizedData.country,
        status: 'active',
        createdAt: new Date(),
        emailVerified: false,
        ...(sanitizedData.type === 'doctor' && {
          medicalLicense: sanitizedData.medicalLicense,
          department: sanitizedData.department,
          designation: sanitizedData.designation,
          education: sanitizedData.education,
          about: sanitizeInput(sanitizedData.about)
        }),
        ...(sanitizedData.type === 'patient' && {
          allergies: sanitizeInput(sanitizedData.allergies)
        })
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), userProfile);

      return userCredential.user.uid;
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        throw new AuthError('Cette adresse email est déjà utilisée');
      } else if (error.code === 'auth/weak-password') {
        throw new AuthError('Le mot de passe est trop faible');
      }
      throw error;
    }
  }, 'AuthService.register');

  // Réinitialisation du mot de passe
  static resetPassword = withErrorHandling(async (email) => {
    if (!email) {
      throw new ValidationError('Email requis');
    }

    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        throw new AuthError('Aucun compte associé à cette adresse email');
      }
      throw new AuthError('Erreur lors de l\'envoi de l\'email de réinitialisation');
    }
  }, 'AuthService.resetPassword');

  // Changement de mot de passe
  static changePassword = withErrorHandling(async (newPassword) => {
    if (!auth.currentUser) {
      throw new AuthError('Utilisateur non connecté');
    }

    try {
      await updatePassword(auth.currentUser, newPassword);
    } catch (error) {
      if (error.code === 'auth/requires-recent-login') {
        throw new AuthError('Veuillez vous reconnecter pour changer votre mot de passe');
      }
      throw new AuthError('Erreur lors du changement de mot de passe');
    }
  }, 'AuthService.changePassword');
}

export { AuthService };