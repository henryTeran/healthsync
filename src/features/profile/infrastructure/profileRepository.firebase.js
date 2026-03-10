import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, db, storage } from "../../../providers/firebase";

export const waitForAuthenticatedUser = () =>
  new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      if (user) resolve(user);
      else reject(new Error("Utilisateur non authentifié"));
    });
  });

export const saveUserById = async (uid, payload) => {
  await setDoc(doc(db, "users", uid), payload);
};

export const getUserById = async (uid) => {
  const snapshot = await getDoc(doc(db, "users", uid));
  return snapshot.exists() ? snapshot.data() : null;
};

export const uploadUserProfilePicture = async (uid, file) => {
  const storageRef = ref(storage, `profilePictures/${uid}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};
