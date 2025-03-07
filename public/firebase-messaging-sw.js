importScripts("https://www.gstatic.com/firebasejs/11.4.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.4.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDtnJPt4gTWc5Hf8g7349xJYmU4bjrbTWQ",
  authDomain: "healthsync-ef94b.firebaseapp.com",
  projectId: "healthsync-ef94b",
  storageBucket: "healthsync-ef94b.firebasestorage.app",
  messagingSenderId: "262506780152",
  appId: "1:262506780152:web:845b098c530eba71ecf20d",
  measurementId: "G-F5C97VDEDB"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("📩 Notification reçue en arrière-plan :", payload);
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.image,
    data: payload.data,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
