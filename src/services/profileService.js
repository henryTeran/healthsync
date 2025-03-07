import { db, storage } from "../providers/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { collection, query, where, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { User} from "..//models/User" ;

const auth = getAuth();

/**
 * Vérifie si l'utilisateur est authentifié avant d'exécuter une action
 */
const getUser = () => {
  return new Promise((resolve, reject) => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        resolve(user);
      } else {
        reject(new Error("Utilisateur non authentifié"));
      }
    });
  });
};

const validateProfileData = (data) => {
  // Convertir l'âge en nombre
  const age = Number(data.age);
  if (!data.lastName || !data.firstName || !age || !data.email) {
    throw new Error("Tous les champs obligatoires doivent être remplis.");
  }
  if (isNaN(age) || data.age < 0) {
    throw new Error("L'âge doit être un nombre positif.");
  }
};

export const saveUserProfile = async (userId, profileData) => {
  try {
    // Si userId est un objet, on récupère son uid
    if (typeof userId !== "string" && userId?.uid) {
      userId = userId.uid;
    }
    validateProfileData(profileData);

    const user = new User(profileData);
 
    await setDoc(doc(db, "users", userId), user.toFirestore());
  } catch (error) {
    console.error("Erreur lors de l'enregistrement du profil :", error);
    throw error;
  }
};

// Récupère un profil utilisateur
export const getUserProfile = async (userId) => {
  try {
    await getUser(); // Vérifie si l'utilisateur est bien connecté
    const docSnap = await getDoc(doc(db, "users", userId));
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error("Erreur lors de la récupération du profil :", error);
    throw error;
  }
};

// Upload une photo de profil et retourne son URL
export const uploadProfilePicture = async (userId, file) => {
  try {
    await getUser(); // Vérifie si l'utilisateur est bien connecté
    const storageRef = ref(storage, `profilePictures/${userId}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error("Erreur lors de l'upload de la photo de profil :", error);
    throw error;
  }
};



export const getPatientPreferences = async (userId) => {
  try {
    const docSnap = await getDoc(doc(db, "users", userId));
    if (!docSnap.exists()) {
      throw new Error("Utilisateur introuvable.");
    }
    return docSnap.data().preferences || {}; // Retourne les préférences (ex: { notificationType: "push" })
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des préférences :", error);
    return null;
  }
};


