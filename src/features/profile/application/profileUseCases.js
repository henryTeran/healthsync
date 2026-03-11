import { User } from "../../../shared/domain/User";
import {
  getUserById,
  saveUserById,
  uploadUserProfilePicture,
  waitForAuthenticatedUser,
} from "../infrastructure/profileRepository.firebase";

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
  const signedIn = await waitForAuthenticatedUser();
  const uid = toUid(userId);

  if (!uid) throw new Error("userId invalide");
  if (uid !== signedIn.uid) {
    throw new Error("Accès refusé: vous ne pouvez écrire que votre propre profil.");
  }

  validateProfileData(profileData);
  const user = new User(profileData);
  await saveUserById(uid, user.toFirestore());
};

export const getUserProfileUseCase = async (userId) => {
  const uid = toUid(userId);
  if (!uid) throw new Error("userId invalide");

  return getUserById(uid);
};

export const uploadProfilePictureUseCase = async (userId, file) => {
  const signedIn = await waitForAuthenticatedUser();
  const uid = toUid(userId);

  if (!uid) throw new Error("userId invalide");
  if (uid !== signedIn.uid) {
    throw new Error("Accès refusé: vous ne pouvez écrire que votre propre profil.");
  }

  return uploadUserProfilePicture(uid, file);
};

export const getPatientPreferencesUseCase = async (userId) => {
  const uid = toUid(userId);
  if (!uid) throw new Error("userId invalide");

  const profile = await getUserById(uid);
  if (!profile) throw new Error("Utilisateur introuvable.");

  return profile.preferences || {};
};
