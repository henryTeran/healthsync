import { getMessaging, getToken } from "firebase/messaging";
import { app, auth, db, storage, functions } from "../config/firebase";

let messaging = null;

if (typeof window !== "undefined") {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.warn("Firebase Messaging non disponible dans cet environnement.", error?.message);
  }
}

export { app, auth, db, storage, functions, messaging };


export const requestForFCMToken = async () => {
  if (!messaging) return null;

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