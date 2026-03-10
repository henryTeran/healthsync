import { AuthError, ValidationError } from "../../../shared/lib/errorHandler";
import { sanitizeInput, validateUserData } from "../../../shared/lib/validation";
import {
  getCurrentAuthUser,
  loginWithEmailPassword,
  logoutCurrentUser,
  registerWithEmailPassword,
  saveUserDocument,
  sendResetPasswordEmail,
  sendVerificationEmail,
  updateCurrentUserPassword,
} from "../infrastructure/authRepository.firebase";

export const loginUseCase = async (email, password) => {
  if (!email || !password) {
    throw new ValidationError("Email et mot de passe requis");
  }

  try {
    const userCredential = await loginWithEmailPassword(email, password);
    return userCredential.user;
  } catch (error) {
    if (error.code === "auth/invalid-credential") {
      throw new AuthError("Email ou mot de passe incorrect");
    }
    if (error.code === "auth/too-many-requests") {
      throw new AuthError("Trop de tentatives. Réessayez plus tard.");
    }
    throw new AuthError("Erreur de connexion");
  }
};

export const registerUseCase = async (userDataOrEmail, password) => {
  if (typeof userDataOrEmail === "string") {
    const email = userDataOrEmail;

    if (!email || !password) {
      throw new ValidationError("Email et mot de passe requis");
    }

    const userCredential = await registerWithEmailPassword(email, password);
    return userCredential.user.uid;
  }

  const userData = userDataOrEmail;
  validateUserData(userData, userData.type);

  const sanitizedData = {
    ...userData,
    firstName: sanitizeInput(userData.firstName),
    lastName: sanitizeInput(userData.lastName),
    address: sanitizeInput(userData.address),
    state: sanitizeInput(userData.state),
    country: sanitizeInput(userData.country),
  };

  try {
    const userCredential = await registerWithEmailPassword(
      sanitizedData.email,
      sanitizedData.password
    );

    await sendVerificationEmail(userCredential.user);

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
      status: "active",
      createdAt: new Date(),
      emailVerified: false,
      ...(sanitizedData.type === "doctor" && {
        medicalLicense: sanitizedData.medicalLicense,
        department: sanitizedData.department,
        designation: sanitizedData.designation,
        education: sanitizedData.education,
        about: sanitizeInput(sanitizedData.about),
      }),
      ...(sanitizedData.type === "patient" && {
        allergies: sanitizeInput(sanitizedData.allergies),
      }),
    };

    await saveUserDocument(userCredential.user.uid, userProfile);
    return userCredential.user.uid;
  } catch (error) {
    if (error.code === "auth/email-already-in-use") {
      throw new AuthError("Cette adresse email est déjà utilisée");
    }
    if (error.code === "auth/weak-password") {
      throw new AuthError("Le mot de passe est trop faible");
    }
    throw error;
  }
};

export const resetPasswordUseCase = async (email) => {
  if (!email) {
    throw new ValidationError("Email requis");
  }

  try {
    await sendResetPasswordEmail(email);
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      throw new AuthError("Aucun compte associé à cette adresse email");
    }
    throw new AuthError("Erreur lors de l'envoi de l'email de réinitialisation");
  }
};

export const changePasswordUseCase = async (newPassword) => {
  if (!getCurrentAuthUser()) {
    throw new AuthError("Utilisateur non connecté");
  }

  try {
    await updateCurrentUserPassword(newPassword);
  } catch (error) {
    if (error.code === "auth/requires-recent-login") {
      throw new AuthError("Veuillez vous reconnecter pour changer votre mot de passe");
    }
    throw new AuthError("Erreur lors du changement de mot de passe");
  }
};

export const logoutUseCase = async () => {
  await logoutCurrentUser();
};
