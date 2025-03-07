import React, { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

export const PrivateRoute = () => {
  const { user, loading } = useContext(AuthContext);
 
  if (loading) return null; // Attendre que l'état soit chargé, sinon afficher un écran vide pour éviter les redirections 

  if (!user) return <Navigate to="/login" />; // Rediriger vers la page de connexion si non connecté 
  // Redirection selon le type d'utilisateur
  if (user.userType === "doctor") {
    return <Outlet />;
  } else if (user.userType === "patient") {
    return <Outlet />;
  } else {
    return <Navigate to="/login" />;
  }
};

