import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // Pour les images
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  key : import.meta.env.VALID_KEY_MESSASING,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const messaging = getMessaging(app);
export const functions = getFunctions(app);


export const requestForFCMToken = async () => {
  
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
        const token = await getToken(messaging, { 
          vapidKey: 
          "BFu9HBapS7r3a-b8uYrISGVYJ527629jSQbVlVZUfIddnzT9x7Z1DvfXRcbTBPtFQOYuG5vrS_QXvC_XV9TXzn4",
         });
        console.log(token)

        return token;
    }
  } catch (error) {
      console.error("Erreur de permission pour les notifications :", error);
  }
};

//  Ecoute des messages en premier plan
onMessage(messaging, (payload) => {
  console.log("📩 Notification reçue :", payload);
  new Notification(payload.notification.title, {
    body: payload.notification.body,
    icon: payload.notification.image,
  });
});