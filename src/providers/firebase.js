import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getMessaging, getToken } from "firebase/messaging";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { logWarn, logError } from "../shared/lib/logger";
import { ERROR_CODES } from "../shared/lib/errorCodes";

const requiredEnvVars = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
];

const missingVars = requiredEnvVars.filter((varName) => !import.meta.env[varName]);
if (missingVars.length > 0) {
  throw new Error(`Variables d'environnement manquantes: ${missingVars.join(", ")}`);
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

let messaging = null;

if (typeof window !== "undefined") {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    logWarn("Firebase Messaging non disponible dans cet environnement.", {
      code: ERROR_CODES.FIREBASE.MESSAGING_INIT_FAILED,
      feature: "firebase",
      action: "getMessaging",
      reason: error?.message,
    });
  }
}
export { messaging };

const emulatorFlag = String(import.meta.env.VITE_USE_FIREBASE_EMULATORS || "")
  .trim()
  .toLowerCase();
const isLocalBrowser =
  typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname);
const useFirebaseEmulators = import.meta.env.DEV && emulatorFlag === "true" && isLocalBrowser;

if (useFirebaseEmulators) {
  try {
    connectFirestoreEmulator(db, "localhost", 8080);
    connectStorageEmulator(storage, "localhost", 9199);
    connectFunctionsEmulator(functions, "localhost", 5001);
  } catch (error) {
    logWarn("Emulateurs Firebase non disponibles", {
      code: ERROR_CODES.FIREBASE.EMULATOR_CONNECT_FAILED,
      feature: "firebase",
      action: "connectEmulators",
      reason: error?.message,
    });
  }
} else if (import.meta.env.DEV) {
  logWarn("Emulateurs Firebase désactivés (mode cloud)", {
    feature: "firebase",
    action: "connectEmulators",
    reason:
      emulatorFlag !== "true"
        ? "VITE_USE_FIREBASE_EMULATORS !== true"
        : "hostname non local, émulateurs bloqués",
  });
}


export const requestForFCMToken = async () => {
  if (!messaging) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
        const token = await getToken(messaging, { 
          vapidKey: 
          "BFu9HBapS7r3a-b8uYrISGVYJ527629jSQbVlVZUfIddnzT9x7Z1DvfXRcbTBPtFQOYuG5vrS_QXvC_XV9TXzn4",
         });
        return token;
    }
  } catch (error) {
      logError("Erreur de permission pour les notifications", error, {
        code: ERROR_CODES.FIREBASE.FCM_TOKEN_FAILED,
        feature: "firebase",
        action: "requestForFCMToken",
      });
  }
};