import { User } from "../../../shared/domain/User";
import {
  getUserById,
  saveUserById,
  uploadUserProfilePicture,
  waitForAuthenticatedUser,
} from "../infrastructure/profileRepository.firebase";
import { logError, logInfo } from "../../../shared/lib/logger";
import { ERROR_CODES } from "../../../shared/lib/errorCodes";

const toUid = (userId) => (typeof userId === "string" ? userId : userId?.uid);

const validateProfileData = (data) => {
  const age = Number(data.age);
  if (!data.lastName || !data.firstName || !age || !data.email) {
    throw new Error("Tous les champs obligatoires doivent être remplis.");
  }
  if (Number.isNaN(age) || age < 0) {
    throw new Error("L'âge doit être un nombre positif.");
  }
};

export const saveUserProfileUseCase = async (userId, profileData) => {
  try {
    const signedIn = await waitForAuthenticatedUser();
    const uid = toUid(userId);

    if (!uid) throw new Error("userId invalide");
    if (uid !== signedIn.uid) {
      throw new Error("Accès refusé: vous ne pouvez écrire que votre propre profil.");
    }

    validateProfileData(profileData);
    const user = new User(profileData);
    await saveUserById(uid, user.toFirestore());

    logInfo("Profil enregistré avec succès", {
      feature: "profile",
      action: "saveUserProfileUseCase",
      userId: uid,
    });
  } catch (error) {
    logError("Échec de sauvegarde du profil", error, {
      code: ERROR_CODES.PROFILE.SAVE_FAILED,
      feature: "profile",
      action: "saveUserProfileUseCase",
      userId: toUid(userId),
    });
    throw error;
  }
};

export const getUserProfileUseCase = async (userId) => {
  try {
    const uid = toUid(userId);
    if (!uid) throw new Error("userId invalide");

    return getUserById(uid);
  } catch (error) {
    logError("Échec de chargement du profil utilisateur", error, {
      code: ERROR_CODES.PROFILE.LOAD_FAILED,
      feature: "profile",
      action: "getUserProfileUseCase",
      userId: toUid(userId),
    });
    throw error;
  }
};

export const uploadProfilePictureUseCase = async (userId, file) => {
  try {
    const signedIn = await waitForAuthenticatedUser();
    const uid = toUid(userId);

    if (!uid) throw new Error("userId invalide");
    if (uid !== signedIn.uid) {
      throw new Error("Accès refusé: vous ne pouvez écrire que votre propre profil.");
    }

    const photoUrl = await uploadUserProfilePicture(uid, file);
    logInfo("Photo de profil téléversée", {
      feature: "profile",
      action: "uploadProfilePictureUseCase",
      userId: uid,
    });
    return photoUrl;
  } catch (error) {
    logError("Échec upload photo de profil", error, {
      code: ERROR_CODES.PROFILE.UPLOAD_PICTURE_FAILED,
      feature: "profile",
      action: "uploadProfilePictureUseCase",
      userId: toUid(userId),
    });
    throw error;
  }
};

export const getPatientPreferencesUseCase = async (userId) => {
  const uid = toUid(userId);
  if (!uid) throw new Error("userId invalide");

  const profile = await getUserById(uid);
  if (!profile) throw new Error("Utilisateur introuvable.");

  return profile.preferences || {};
};
