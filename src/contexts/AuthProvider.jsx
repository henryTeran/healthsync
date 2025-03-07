//src/context/AuthProvider.jsx

import React, { useState, useEffect } from "react";
import { auth } from "../providers/firebase";
import { onAuthStateChanged } from "firebase/auth";
import PropTypes from "prop-types";
import { getUserProfile } from "../services/profileService";
import { AuthContext } from "../contexts/AuthContext";
import { AuthService } from "../services/authService";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // État de chargement global
  const [authReady, setAuthReady] = useState(false); // État pour indiquer si Firebase est prêt

  // Écouteur persistant pour les changements d'état d'authentification
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      
      if (currentUser) {
        try {
          const userProfile = await getUserProfile(currentUser.uid); // Récupérer le profil depuis Firestore
          setUser({ ...currentUser, userType: userProfile.type }); // Mettre à jour l'état local
        } catch (error) {
          console.error("Erreur lors de la récupération du profil utilisateur :", error.message);
          setUser(null); // En cas d'erreur, réinitialiser l'utilisateur
        }
      } else {
        setUser(null); // Aucun utilisateur connecté
      }
      setAuthReady(true); // Marquer Firebase comme prêt
      setLoading(false); // Fin du chargement initial
    });

    return () => unsubscribe(); // Nettoyer l'écouteur lors du démontage
  }, []);

  const login = async (email, password) => {
    return AuthService.login (email, password );
  };

  const register = async (email, password) => {
    return AuthService.register (email, password );
  };

  const logout = async () => {
    return AuthService.logout ();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {/* Afficher les enfants seulement après que Firebase soit prêt */}
      {authReady ? children : <p>Chargement...</p>}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};