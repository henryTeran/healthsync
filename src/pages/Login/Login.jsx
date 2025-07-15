import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Stethoscope, Mail, Lock, ArrowRight, Shield } from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";


export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useContext(AuthContext);

  
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
  
    try {
      await login(email, password);
  
      // Attendre que AuthContext mette à jour l'utilisateur
      setTimeout(() => {
        console.log(" Connexion réussie, redirection...");
        navigate("/dashboard");
      }, 2000); // Petit délai pour attendre l'état user
    } catch (err) {
      console.error(" Erreur de connexion :", err);
  
      if (err.code === "auth/invalid-credential") {
        setError("Aucun compte trouvé avec cet email. Redirection vers l'inscription...");
        setTimeout(() => navigate("/register"), 2000);
      } else {
        setError("Erreur de connexion. Vérifiez vos identifiants.");
      }
    }
  };
  
  




  return (
    <div className="min-h-screen bg-mesh flex">
      {/* Côté gauche - Hero Section */} 
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-medical relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Stethoscope className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">HealthSync</h1>
                <p className="text-medical-100">Plateforme Médicale Moderne</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <h2 className="text-3xl font-bold leading-tight">
              Gérez vos données médicales en toute sécurité
            </h2>
            <p className="text-xl text-medical-100 leading-relaxed">
              Une solution complète pour médecins et patients avec suivi en temps réel, 
              prescriptions numériques et communication sécurisée.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Sécurité Maximale</h3>
                <p className="text-medical-100">Chiffrement bout-en-bout des données médicales</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
      </div>
      
      {/* Côté droit - Formulaire de connexion */}
      <div className="flex-1 flex items-center justify-center px-8 lg:px-12">
        <div className="w-full max-w-md">
          {/* Header mobile */}
          <div className="lg:hidden mb-8 text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-medical rounded-xl flex items-center justify-center">
                <Stethoscope className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gradient">HealthSync</h1>
            </div>
          </div>

          <div className="card-medical p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-neutral-800 mb-2">
                Connexion
              </h2>
              <p className="text-neutral-600">
                Accédez à votre espace médical sécurisé
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                  Adresse e-mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-medical-400" />
                  <input 
                    type="email" 
                    id="email" 
                    placeholder="votre@email.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                    className="input pl-12"
                    aria-label="Adresse e-mail"
                  />
                </div>
              </div>
          
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-medical-400" />
                  <input 
                    type="password" 
                    id="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                    className="input pl-12"
                    aria-label="Mot de passe"
                  />
                </div>
              </div>
      
              <button 
                type="submit" 
                className="btn-primary w-full group"
                aria-label="Connexion"
              >
                <span>Se connecter</span>
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </form>

            <div className="mt-6 space-y-3 text-center">
              <a href="#" className="text-medical-600 hover:text-medical-700 text-sm font-medium transition-colors">
                Mot de passe oublié ?
              </a>
              <div className="divider-medical"></div>
              <p className="text-neutral-600 text-sm">
                Pas encore de compte ?{" "}
                <a href="/register" className="text-medical-600 hover:text-medical-700 font-medium transition-colors">
                  Créer un compte
                </a>
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-neutral-500">
              © 2025 HealthSync. Tous droits réservés.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}