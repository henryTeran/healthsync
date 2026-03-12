//src/context/AuthProvider.jsx

import React, { useState, useEffect } from "react";
import { auth } from "../providers/firebase";
import { onAuthStateChanged } from "firebase/auth";
import PropTypes from "prop-types";
import { getUserProfile } from "../features/profile";
import { AuthContext } from "../contexts/AuthContext";
import { AuthService } from "../features/auth";
import { setMonitoringUser } from "../app/monitoring/sentry";
import { logError } from "../shared/lib/logger";
import { ERROR_CODES } from "../shared/lib/errorCodes";

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
          const nextUser = { ...currentUser, userType: userProfile?.type || null };
          setUser(nextUser); // Mettre à jour l'état local
          setMonitoringUser(nextUser);
        } catch (error) {
          logError("Erreur lors de la récupération du profil utilisateur", error, {
            code: ERROR_CODES.AUTH.PROFILE_LOAD_FAILED,
            feature: "auth",
            action: "onAuthStateChanged",
            userId: currentUser?.uid,
          });
          setUser(null); // En cas d'erreur, réinitialiser l'utilisateur
          setMonitoringUser(null);
        }
      } else {
        setUser(null); // Aucun utilisateur connecté
        setMonitoringUser(null);
      }
      setAuthReady(true); // Marquer Firebase comme prêt
      setLoading(false); // Fin du chargement initial
    });

    return () => unsubscribe(); // Nettoyer l'écouteur lors du démontage
  }, []);

  const login = async (email, password) => {
    return AuthService.login(email, password);
  };

  const register = async (email, password) => {
    return AuthService.register(email, password);
  };

  const logout = async () => {
    return AuthService.logout();
  };

  const value = {
    user,
    loading,
    authReady,
    isAuthenticated: !!user,
    isDoctor: user?.type === 'doctor',
    isPatient: user?.type === 'patient',
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Afficher les enfants seulement après que Firebase soit prêt */}
      {authReady ? children : <p>Chargement...</p>}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};