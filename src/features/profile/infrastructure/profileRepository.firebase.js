import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, db, storage } from "../../../providers/firebase";
import { logError } from "../../../shared/lib/logger";
import { ERROR_CODES } from "../../../shared/lib/errorCodes";

export const waitForAuthenticatedUser = () =>
  new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      if (user) resolve(user);
      else reject(new Error("Utilisateur non authentifié"));
    });
  });

export const saveUserById = async (uid, payload) => {
  try {
    await setDoc(doc(db, "users", uid), payload);
  } catch (error) {
    logError("Échec setDoc utilisateur", error, {
      code: ERROR_CODES.PROFILE.SAVE_FAILED,
      feature: "profile",
      action: "saveUserById",
      userId: uid,
    });
    throw error;
  }
};

export const getUserById = async (uid) => {
  try {
    const snapshot = await getDoc(doc(db, "users", uid));
    return snapshot.exists() ? snapshot.data() : null;
  } catch (error) {
    logError("Échec getDoc utilisateur", error, {
      code: ERROR_CODES.PROFILE.LOAD_FAILED,
      feature: "profile",
      action: "getUserById",
      userId: uid,
    });
    throw error;
  }
};

export const uploadUserProfilePicture = async (uid, file) => {
  try {
    const storageRef = ref(storage, `profilePictures/${uid}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  } catch (error) {
    logError("Échec upload photo profil (storage)", error, {
      code: ERROR_CODES.PROFILE.UPLOAD_PICTURE_FAILED,
      feature: "profile",
      action: "uploadUserProfilePicture",
      userId: uid,
    });
    throw error;
  }
};
