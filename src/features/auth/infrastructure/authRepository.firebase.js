import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../../config/firebase";

export const loginWithEmailPassword = async (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const registerWithEmailPassword = async (email, password) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const sendVerificationEmail = async (user) => {
  await sendEmailVerification(user);
};

export const saveUserDocument = async (userId, payload) => {
  await setDoc(doc(db, "users", userId), payload);
};

export const sendResetPasswordEmail = async (email) => {
  await sendPasswordResetEmail(auth, email);
};

export const updateCurrentUserPassword = async (newPassword) => {
  await updatePassword(auth.currentUser, newPassword);
};

export const logoutCurrentUser = async () => {
  await signOut(auth);
};

export const getCurrentAuthUser = () => auth.currentUser;
