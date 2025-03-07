import React, { useState, useEffect, useRef, useContext } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { onSnapshot, query, collection, where, doc, updateDoc } from "firebase/firestore";
import { db } from "../providers/firebase";

export const NotificationWidget = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const { user } = useContext(AuthContext);
  const popupRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "notifications"), where("userId", "==", user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatedNotifications = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setNotifications(updatedNotifications);

      // 🔥 Compte uniquement les notifications non lues
      setUnreadCount(updatedNotifications.filter((n) => !n.read).length);
    });

    return () => unsubscribe();
  }, [user]);

  // 🔹 Fonction pour gérer le clic sur une notification
  const handleNotificationClick = async (notif) => {
    if (!notif.read) {
      // Marquer la notification comme lue dans Firestore
      const notifRef = doc(db, "notifications", notif.id);
      await updateDoc(notifRef, { read: true });

      // Mise à jour immédiate du state
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );

      // 🔥 Réduire le compteur
      setUnreadCount((prev) => (prev > 0 ? prev - 1 : 0));
    }

    // 🔹 Rediriger vers la page appropriée
    if (notif.type === "new_appointment_request" || notif.type === "reponse_appointment_request") {
      navigate("/appointments");
    } else if (notif.type === "chat") {
      navigate(`/chat/${notif.senderId}`);
    } else if (notif.type === "prescription") {
      navigate(`/medications_/${notif.prescriptionId}`);
    }

    setShowPopup(false); // Fermer la popup après clic
  };

  // 🔹 Fermer la popup si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setShowPopup(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative">
      {/* 🔔 Icône Notification */}
      <button
        onClick={() => setShowPopup(!showPopup)}
        className="relative p-2 bg-gray-100 rounded-full shadow-md hover:bg-gray-200"
      >
        <Bell className="h-6 w-6 text-blue-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {/* 🔹 Popup des notifications */}
      {showPopup && (
        <div ref={popupRef} className="absolute right-0 mt-2 bg-white shadow-md rounded-md p-2 w-80">
          <h3 className="text-sm font-bold mb-2">Notifications</h3>
          {notifications.length > 0 ? (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`flex justify-between items-center py-1 border-b last:border-b-0 ${
                  notif.read ? "text-gray-500" : "font-bold"
                }`}
              >
                <p>{notif.message}</p>
                <button
                  className="text-blue-500 hover:underline"
                  onClick={() => handleNotificationClick(notif)}
                >
                  Voir
                </button>
              </div>
            ))
          ) : (
            <p className="text-gray-500">Aucune notification.</p>
          )}
        </div>
      )}
    </div>
  );
};
