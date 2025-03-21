import React, { useState, useEffect, useRef } from "react";
import { Menu, Search, Settings, LogOut, CircleHelp, MessageCircleMore, UserCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { AuthService } from "../services/authService";
import { getAuth } from "firebase/auth";
import { collection, onSnapshot, query, where, updateDoc, getDocs } from "firebase/firestore";
import { db } from "../providers/firebase";
import { NotificationWidget } from "./NotificationWidget";
import PhotoProfil from "../../src/assets/default-profile.jpg"; 
import { getUserProfile } from "../services/profileService";


export const Header = ({ toggleSidebar, isCollapsed }) => {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showChatPopup, setShowChatPopup] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0); 
  const [unreadMessages, setUnreadMessages] = useState({});
  const [ProfilPhoto, setProfilPhoto] = useState(PhotoProfil);

  const dropdownRef = useRef(null);
  const chatRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    AuthService.logout();
    navigate("/login");
  };

  // 🔹 Fonction pour écouter les messages non lus en temps réel
  const fetchUnreadChatCountRealtime = (userId) => {
    const q = query(collection(db, "messages"), where("receiverId", "==", userId), where("status", "!=", "read"));

    return onSnapshot(q, (snapshot) => {
      const unreadMessagesData = {};
      let totalUnread = 0;

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (!unreadMessagesData[data.senderId]) {
          unreadMessagesData[data.senderId] = { count: 0, lastMessage: {} };
        }
        unreadMessagesData[data.senderId].count += 1;
        unreadMessagesData[data.senderId].lastMessage = data;
        totalUnread++;
      });

      setUnreadMessages(unreadMessagesData);
      setUnreadChatCount(totalUnread); 
    });
  };

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const unsubscribeChat = fetchUnreadChatCountRealtime(user.uid);
    return () => unsubscribeChat(); // Stopper l'écoute en quittant la page
  }, []);

  //  Marquer les messages d'un contact comme lus
  const markMessagesAsRead = async (senderId) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "messages"),
      where("receiverId", "==", user.uid),
      where("senderId", "==", senderId),
      where("status", "!=", "read")
    );

    const snapshot = await getDocs(q);
    const updatePromises = snapshot.docs.map((doc) => updateDoc(doc.ref, { status: "read" }));
    await Promise.all(updatePromises);

    //  Mise à jour du badge de notifications après la lecture
    setUnreadMessages((prev) => {
      const newUnread = { ...prev };
      delete newUnread[senderId]; // Supprime seulement le message du contact ouvert
      return newUnread;
    });

    //  Recalcule le total des messages non lus
    setUnreadChatCount((prev) => {
      const newCount = prev - (unreadMessages[senderId]?.count || 0);
      return newCount > 0 ? newCount : 0; // Évite d'afficher un nombre négatif
    });

    //  Redirige vers le chat du contact sélectionné
    navigate(`/chat/${senderId}`);
  };

  //  Gérer les clics en dehors des popups
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        (dropdownRef.current && !dropdownRef.current.contains(event.target)) ||
        (chatRef.current && !chatRef.current.contains(event.target))
      ) {
        setShowDropdown(false);
        setShowChatPopup(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getProfilFoto = async () => { 
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;
    const dataProfile = await getUserProfile(user.uid);
    console.log(dataProfile.photoURL);
    if (dataProfile.photoURL) {
      setProfilPhoto(dataProfile.photoURL);
    }
  };

  useEffect(() => {
    getProfilFoto();
    console.log(ProfilPhoto);
  }, []);
;

  return (
    <header className={`bg-white shadow-md p-4 flex items-center justify-between w-full transition-all ${!isCollapsed ? "pl-10" : "pl-8"}`}>
      <div className="flex items-center space-x-4">
        <button className="p-2 bg-gray-100 rounded-full shadow-md hover:bg-gray-200" onClick={toggleSidebar}>
          <Menu className="h-6 w-6 text-blue-700" />
        </button>
        <div className="relative">
          <input type="text" placeholder="Rechercher un patient..." className="p-2 pl-10 pr-4 rounded-full bg-gray-100 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <NotificationWidget />

        <button className="relative p-2 bg-gray-100 rounded-full shadow-md hover:bg-gray-200" onClick={() => setShowChatPopup(!showChatPopup)}>
          <MessageCircleMore className="h-6 w-6 text-blue-700" />
          {unreadChatCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {unreadChatCount}
            </span>
          )}
        </button>

        {showChatPopup && (
          <div ref={chatRef} className="absolute right-4 top-8 mt-10 w-96 bg-white rounded-lg shadow-lg border z-50">
            <h3 className="px-4 py-2 font-bold text-gray-700 border-b">Messages non lus</h3>
            <ul className="max-h-64 overflow-y-auto">
              {Object.keys(unreadMessages).length > 0 ? (
                Object.entries(unreadMessages).map(([senderId, { count, lastMessage }]) => (
                  <li key={senderId} className="px-4 py-2 flex items-center cursor-pointer hover:bg-gray-100 border-b" onClick={() => markMessagesAsRead(senderId)}>
                    <UserCircle className="h-10 w-10 text-gray-500 mr-2" />
                    <div className="flex-1">
                      <span className="font-semibold text-gray-700">{lastMessage.senderName}</span>
                      <p className="text-sm text-gray-500 truncate">{lastMessage.content}</p>
                    </div>
                    <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">{count}</span>
                  </li>
                ))
              ) : (
                <li className="px-4 py-2 text-gray-500">Aucun message non lu.</li>
              )}
            </ul>
          </div>
        )}

        <div className="relative">
          <button className="p-1 rounded-full shadow-md hover:opacity-80" onClick={() => setShowDropdown(!showDropdown)}>
            <img src= {ProfilPhoto} alt="Profil" className="w-10 h-10 rounded-full object-cover" />
          </button>

          {showDropdown && (
            <div ref={dropdownRef} className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border">
              <Link to="/settings" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Paramètres
              </Link>
              <Link to="/help" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center">
                <CircleHelp className="h-5 w-5 mr-2" />
                Aide
              </Link>
              <button className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center w-full text-left" onClick={handleLogout}>
                <LogOut className="h-5 w-5 mr-2" />
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

Header.propTypes = {
  toggleSidebar: PropTypes.func.isRequired,
  isCollapsed: PropTypes.bool.isRequired,
};
