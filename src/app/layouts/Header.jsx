import React, { useState, useEffect, useRef } from "react";
import { Menu, Search, Settings, LogOut, CircleHelp, MessageCircleMore, UserCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { AuthService } from "../../features/auth";
import { useAuth } from "../../contexts/AuthContext";
import { listenUnreadMessagesByUser, markMessagesAsReadUseCase } from "../../features/chat";
import { NotificationWidget } from "../../features/notifications/ui/NotificationWidget";
import PhotoProfil from "../../assets/default-profile.jpg";
import { getUserProfile } from "../../features/profile";


export const Header = ({ toggleSidebar, isCollapsed }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showChatPopup, setShowChatPopup] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0); 
  const [unreadMessages, setUnreadMessages] = useState({});
  const [ProfilPhoto, setProfilPhoto] = useState(PhotoProfil);
  const [currentUser, setCurrentUser] = useState(null);

  const dropdownRef = useRef(null);
  const chatRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    AuthService.logout();
    navigate("/login");
  };

  // 🔹 Récupérer les informations de l'utilisateur connecté
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (user) {
        const userProfile = await getUserProfile(user.uid);
        setCurrentUser(userProfile);
      }
    };
    fetchCurrentUser();
  }, [user]);

  // 🔹 Déterminer le placeholder de la barre de recherche
  const getSearchPlaceholder = () => {
    if (!currentUser) return "Rechercher...";
    
    if (currentUser.type === "doctor") {
      return "Rechercher un patient ou médecin...";
    } else {
      return "Rechercher un médecin...";
    }
  };
  // 🔹 Fonction pour écouter les messages non lus en temps réel
  useEffect(() => {
    if (!user) return;

    const unsubscribeChat = listenUnreadMessagesByUser(user.uid, ({ unreadMessages, totalUnread }) => {
      setUnreadMessages(unreadMessages);
      setUnreadChatCount(totalUnread);
    });
    return () => unsubscribeChat(); // Stopper l'écoute en quittant la page
  }, [user]);

  //  Marquer les messages d'un contact comme lus
  const handleMarkMessagesAsRead = async (senderId) => {
    if (!user) return;
    await markMessagesAsReadUseCase(user.uid, senderId);

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
    if (!user) return;
    const dataProfile = await getUserProfile(user.uid);
    if (dataProfile.photoURL) {
      setProfilPhoto(dataProfile.photoURL);
    }
  };

  useEffect(() => {
    getProfilFoto();
  }, [user]);

  return (
    <header className={`glass-medical backdrop-blur-xl border-b border-medical-100/30 p-4 flex items-center justify-between w-full transition-all duration-300 ${!isCollapsed ? "pl-10" : "pl-8"}`}>
      <div className="flex items-center space-x-4">
        <button className="btn-ghost p-3 rounded-xl hover-lift" onClick={toggleSidebar}>
          <Menu className="h-5 w-5 text-medical-600" />
        </button>
        <div className="relative">
          <input 
            type="text" 
            placeholder={getSearchPlaceholder()}
            className="input pl-12 pr-4 w-80 bg-white/60 backdrop-blur-sm" 
          />
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-medical-400" />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative">
          <NotificationWidget />
        </div>

        <button className="relative btn-ghost p-3 rounded-xl hover-lift" onClick={() => setShowChatPopup(!showChatPopup)}>
          <MessageCircleMore className="h-5 w-5 text-medical-600" />
          {unreadChatCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-soft animate-pulse-soft">
              {unreadChatCount}
            </span>
          )}
        </button>

        {showChatPopup && (
          <div ref={chatRef} className="absolute right-4 top-16 w-96 card-medical z-[99999] animate-slide-down" style={{ zIndex: 99999 }}>
            <h3 className="px-6 py-4 font-semibold text-medical-800 border-b border-medical-100">Messages non lus</h3>
            <ul className="max-h-64 overflow-y-auto scrollbar-thin">
              {Object.keys(unreadMessages).length > 0 ? (
                Object.entries(unreadMessages).map(([senderId, { count, lastMessage }]) => (
                  <li key={senderId} className="px-6 py-4 flex items-center cursor-pointer hover:bg-medical-50 border-b border-medical-50 transition-colors duration-200" onClick={() => handleMarkMessagesAsRead(senderId)}>
                    <div className="w-10 h-10 bg-gradient-to-br from-medical-400 to-medical-500 rounded-full flex items-center justify-center mr-3">
                      <UserCircle className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-neutral-800">{lastMessage.senderName}</span>
                      <p className="text-sm text-neutral-500 truncate mt-1">{lastMessage.content}</p>
                    </div>
                    <span className="badge-info">{count}</span>
                  </li>
                ))
              ) : (
                <li className="px-6 py-8 text-center text-neutral-500">
                  <MessageCircleMore className="h-12 w-12 text-neutral-300 mx-auto mb-2" />
                  <p>Aucun message non lu</p>
                </li>
              )}
            </ul>
          </div>
        )}

        <div className="relative">
          <button className="relative p-1 rounded-full hover-lift focus-ring" onClick={() => setShowDropdown(!showDropdown)}>
            <img src={ProfilPhoto} alt="Profil" className="w-10 h-10 rounded-full object-cover border-2 border-medical-200 shadow-soft" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-health-500 border-2 border-white rounded-full"></div>
          </button>

          {showDropdown && (
            <div ref={dropdownRef} className="absolute right-0 mt-3 w-56 card-medical animate-slide-down z-[99999]" style={{ zIndex: 99999 }}>
              <Link to="/settings" className="flex items-center px-4 py-3 text-neutral-700 hover:bg-medical-50 transition-colors duration-200 rounded-t-xl">
                <Settings className="h-4 w-4 mr-3 text-medical-500" />
                Paramètres
              </Link>
              <Link to="/help" className="flex items-center px-4 py-3 text-neutral-700 hover:bg-medical-50 transition-colors duration-200">
                <CircleHelp className="h-4 w-4 mr-3 text-medical-500" />
                Aide
              </Link>
              <div className="border-t border-medical-100 my-1"></div>
              <button className="flex items-center px-4 py-3 text-red-600 hover:bg-red-50 transition-colors duration-200 w-full text-left rounded-b-xl" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-3" />
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