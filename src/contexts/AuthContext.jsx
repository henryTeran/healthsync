import { createContext, useContext } from "react";

export const AuthContext = createContext();

//  Hook personnalisé pour utiliser facilement AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};