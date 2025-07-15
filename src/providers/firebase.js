import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; 
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { getFunctions } from "firebase/functions";

// Debug environment variables
console.log('Firebase Config Environment Variables:', {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
});

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDtnJPt4gTWc5Hf8g7349xJYmU4bjrbTWQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "healthsync-ef94b.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "healthsync-ef94b",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "healthsync-ef94b.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "262506780152",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:262506780152:web:845b098c530eba71ecf20d",
};

console.log('Final Firebase Config:', firebaseConfig);

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