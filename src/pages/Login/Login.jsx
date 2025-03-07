import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/HealthSyncLogo-removebg.png";
import { AuthContext } from "../../contexts/AuthContext";
import { getToken } from "firebase/messaging";
import { auth, db, messaging, requestForFCMToken } from "../../providers/firebase";
import { doc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";



export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { login } = useContext(AuthContext);
  const saveFCMToken = async (user) => {
    if (!user) return;
    try {
      const token = await requestForFCMToken(user);
      if (token) {
        await setDoc(doc(db, "users", user.uid), { fcmToken: token }, { merge: true });
        console.log("✅ Token FCM enregistré !");
      }
    } catch (error) {
      console.error("❌ Erreur lors de l'enregistrement du token :", error);
    }
  };
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
  
    try {
      console.log("🟡 Tentative de connexion...");
      await login(email, password);
  
      // ✅ Attendre que AuthContext mette à jour l'utilisateur
      setTimeout(() => {
        console.log("✅ Connexion réussie, redirection...");
        navigate("/dashboard");
      }, 2000); // Petit délai pour attendre l'état user
    } catch (err) {
      console.error("❌ Erreur de connexion :", err);
  
      if (err.code === "auth/invalid-credential") {
        setError("Aucun compte trouvé avec cet email. Redirection vers l'inscription...");
        setTimeout(() => navigate("/register"), 2000);
      } else {
        setError("Erreur de connexion. Vérifiez vos identifiants.");
      }
    }
  };
  
  




  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-200 to-white-200">
      {/*diviser en deux blocs la page login 
        1.- côté gauche le logo avec un paragraphe en dessous 
        2.- coté droit le formulaire de connexion
      */} 

      {/* côté gauche*/} 
      <div className="md:block w-1/2 text-black py-8 px-4 text-center translate-x-[-10rem]">
        <div className="w-96 h-96 mx-auto mb-4"> {/* Conteneur pour contrôler la taille */}
          <img
            src={logo}
            alt="HealthSync Logo"
            className="w-full h-full rounded-full object-cover"
          />
        </div>
        <p className="text-2xl text-black-200">
          Suivez vos données médicales en toute simplicité. <span></span><br />HealthSync est votre
          compagnon de santé numérique.
        </p>
      </div>
      
      {/*côté droit*/}
      <div className="border border-gray-300 p-8 rounded-lg shadow-lg w-96 translate-x-[0,2rem] ">
        <div className="text-2xl font-bold mb-4 text-center" >HealthSync <span className="text-red-500">+</span></div>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <p className="text-gray-600 mb-4">Authentifiez-vous pour commencer</p>
        <form className="mt-4 flex flex-col gap-4" onSubmit={handleLogin}>
          <label htmlFor="email" className="sr-only">Adresse e-mail</label>
          <input 
              type="email" 
              id="email" 
              placeholder="Adresse e-mail" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              aria-label="Adresse e-mail"
            
          />
          
          <label htmlFor="password" className="sr-only">Mot de passe</label>
          <input 
              type="password" 
              id="password" 
              placeholder="Mot de passe" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              aria-label="Mot de passe"
          />
      
          
          <button 
              type="submit" 
              className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
              aria-label="Connexion"
          >
              Connexion
          </button>
        </form>

        <div className="mt-4 text-sm">
          <a href="#" className="text-blue-500 hover:underline">J'ai oublié mon mot de passe</a> <br /> 
          <a href={"/register"} className="text-blue-500 hover:underline">Créer un compte</a>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          Copyright © 2025 Henry Teran <br />All rights reserved
        </div>
      </div>
    </div>
  );
}