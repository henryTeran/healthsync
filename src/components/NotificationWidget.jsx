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

      //  Compte uniquement les notifications non lues
      setUnreadCount(updatedNotifications.filter((n) => !n.read).length);
    });

    return () => unsubscribe();
  }, [user]);

  //  Fonction pour gérer le clic sur une notification
  const handleNotificationClick = async (notif) => {
    if (!notif.read) {
      // Marquer la notification comme lue dans Firestore
      const notifRef = doc(db, "notifications", notif.id);
      await updateDoc(notifRef, { read: true });

      // Mise à jour immédiate du state
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );

      //  Réduire le compteur
      setUnreadCount((prev) => (prev > 0 ? prev - 1 : 0));
    }

    //  Rediriger vers la page appropriée
    if (notif.type === "new_appointment_request" || notif.type === "reponse_appointment_request") {
      navigate("/appointments");
    } else if (notif.type === "chat") {
      navigate(`/chat/${notif.senderId}`);
    } else if (notif.type === "prescription") {
      navigate(`/medications_/${notif.prescriptionId}`);
    }

    setShowPopup(false); // Fermer la popup après clic
  };

  //  Fermer la popup si on clique en dehors
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
      {/*  Icône Notification */}
      <button
        onClick={() => setShowPopup(!showPopup)}
        className="relative btn-ghost p-3 rounded-xl hover-lift"
      >
        <Bell className="h-5 w-5 text-medical-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-soft animate-pulse-soft">
            {unreadCount}
          </span>
        )}
      </button>

      {/* 🔹 Popup des notifications */}
      {showPopup && (
        <div ref={popupRef} className="absolute right-0 mt-3 w-80 card-medical animate-slide-down">
          <div className="px-6 py-4 border-b border-medical-100">
            <h3 className="font-semibold text-medical-800">Notifications</h3>
          </div>
          {notifications.length > 0 ? (
            <div className="max-h-64 overflow-y-auto scrollbar-thin">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`px-6 py-4 border-b border-medical-50 last:border-b-0 cursor-pointer hover:bg-medical-50 transition-colors duration-200 ${
                    notif.read ? "opacity-60" : ""
                  }`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${notif.read ? 'bg-neutral-300' : 'bg-medical-500'}`}></div>
                    <div className="flex-1">
                      <p className={`text-sm ${notif.read ? 'text-neutral-500' : 'text-neutral-800 font-medium'}`}>
                        {notif.message}
                      </p>
                      <p className="text-xs text-neutral-400 mt-1">
                        {new Date(notif.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-8 text-center">
              <Bell className="h-12 w-12 text-neutral-300 mx-auto mb-2" />
              <p className="text-neutral-500">Aucune notification</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
