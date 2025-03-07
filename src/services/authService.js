// src/services/AuthService.js

import { auth } from "../providers/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getUserProfile } from "../services/profileService";


export class AuthService {
  static async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userProfile = await getUserProfile(userCredential.user.uid); // Récupérer le profil depuis Firestore
      return { ...userCredential.user, userType: userProfile.type };
    } catch (error) {
      let errorMessage = "Erreur de connexion";
      if (error.code === "auth/invalid-credential") {
        errorMessage = "Utilisateur non enregistré";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Mot de passe incorrect";
      }
      console.error(errorMessage, error.code);
      throw error;
    }
  }
  
  static async register(email, password) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return  userCredential.user.uid;
    } catch (error) {
      console.error("Erreur d'inscription :", error.message);
      throw error;
    }
  }

  static async logout() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Erreur de déconnexion :", error.message);
      throw error;
    }
  }
}

