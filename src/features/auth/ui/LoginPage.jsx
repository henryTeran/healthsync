import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Bot,
  FileCheck2,
  Lock,
  Mail,
  MessageSquareHeart,
  Shield,
  Stethoscope,
  UserCircle2,
} from "lucide-react";
import { AuthContext } from "../../../contexts/AuthContext";
import { AuthService } from "../../../features/auth";

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");
  const [isResetLoading, setIsResetLoading] = useState(false);
  const { login } = useContext(AuthContext);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password);

      setTimeout(() => {
        navigate("/dashboard");
      }, 1200);
    } catch (err) {
      console.error("Erreur de connexion :", err);

      if (err.code === "auth/invalid-credential") {
        setError("Aucun compte trouvé avec cet email. Redirection vers l'inscription...");
        setTimeout(() => navigate("/register"), 1500);
      } else {
        setError("Erreur de connexion. Vérifiez vos identifiants.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setResetMessage("");
    setResetError("");

    if (!resetEmail?.trim()) {
      setResetError("Veuillez renseigner votre adresse e-mail.");
      return;
    }

    try {
      setIsResetLoading(true);
      await AuthService.resetPassword(resetEmail.trim());
      setResetMessage("Un e-mail de réinitialisation a été envoyé. Vérifiez votre boîte de réception.");
    } catch (resetErr) {
      setResetError(resetErr.message || "Impossible d'envoyer l'e-mail de réinitialisation.");
    } finally {
      setIsResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-mesh flex flex-col lg:flex-row">
      <section className="relative lg:w-3/5 h-[360px] lg:h-auto overflow-hidden bg-gradient-to-br from-blue-600 via-cyan-500 to-violet-500 p-8 lg:p-12 text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10 h-full flex flex-col justify-between">
          <div className="mb-8">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/15 backdrop-blur-xl border border-white/20 shadow-xl">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Stethoscope className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold tracking-wide">HealthSync</p>
                <p className="text-xs text-white/80">Plateforme HealthTech sécurisée</p>
              </div>
            </div>

            <h2 className="mt-8 text-3xl lg:text-5xl font-bold leading-tight max-w-xl">
              Gérez vos données médicales en toute sécurité
            </h2>
            <p className="mt-5 text-base lg:text-lg text-white/90 max-w-xl leading-relaxed">
              Une solution complète pour médecins et patients avec suivi en temps réel,
              prescriptions numériques et communication sécurisée.
            </p>
          </div>

          <div className="hidden md:block relative h-44 lg:h-64 mt-8">
            <div className="absolute top-0 left-0 w-52 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/25 shadow-2xl p-4 animate-[pulse_5s_ease-in-out_infinite]">
              <p className="text-xs text-white/80 mb-2">Prescription active</p>
              <div className="flex items-center gap-2">
                <FileCheck2 className="h-5 w-5" />
                <p className="font-medium">Traitement cardio validé</p>
              </div>
            </div>

            <div className="absolute top-8 right-10 w-56 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/25 shadow-2xl p-4 animate-[pulse_6s_ease-in-out_infinite]">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquareHeart className="h-5 w-5" />
                <p className="font-medium">Chat sécurisé</p>
              </div>
              <p className="text-xs text-white/80">Dr. Martin a répondu à votre message.</p>
            </div>

            <div className="absolute bottom-3 left-14 w-52 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/25 shadow-2xl p-4 animate-[pulse_4s_ease-in-out_infinite]">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-5 w-5" />
                <p className="font-medium">Analytics santé</p>
              </div>
              <div className="h-2 rounded-full bg-white/30 overflow-hidden">
                <div className="h-full w-2/3 bg-white rounded-full" />
              </div>
            </div>

            <div className="absolute bottom-8 right-0 w-44 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/25 shadow-2xl p-4 animate-[pulse_7s_ease-in-out_infinite]">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                <p className="text-sm font-medium">Assistant médical</p>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute -top-12 -right-8 w-36 h-36 rounded-full bg-white/20 blur-2xl" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-cyan-200/30 blur-2xl" />
      </section>

      <section className="lg:w-2/5 flex items-center justify-center px-4 sm:px-8 py-8 lg:py-12">
        <div className="w-full max-w-xl">
          <div className="lg:hidden mb-8 text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-medical rounded-xl flex items-center justify-center">
                <Stethoscope className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gradient">HealthSync</h1>
            </div>
          </div>

          <div className="w-full card-medical p-6 sm:p-8 rounded-3xl border border-white/50 shadow-2xl transition-all duration-300 hover:-translate-y-0.5">
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-medical-50 border border-medical-100 flex items-center justify-center shadow-soft">
                <UserCircle2 className="h-8 w-8 text-medical-600" />
              </div>
              <h2 className="text-2xl font-bold text-neutral-800 mt-4 mb-1">Connexion sécurisée</h2>
              <p className="text-neutral-600">Accédez à votre espace médical premium en toute confiance.</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label htmlFor="email" className="text-sm font-medium text-neutral-700 mb-2 inline-flex items-center gap-2">
                  <Mail className="h-4 w-4 text-medical-500" />
                  Adresse e-mail
                </label>
                <div className="relative group mt-2">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-medical-400 transition-colors duration-300 group-focus-within:text-medical-600" />
                  <input
                    type="email"
                    id="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="input pl-12 h-12 border-medical-200 focus:ring-4 focus:ring-medical-100"
                    aria-label="Adresse e-mail"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="text-sm font-medium text-neutral-700 mb-2 inline-flex items-center gap-2">
                  <Lock className="h-4 w-4 text-medical-500" />
                  Mot de passe
                </label>
                <div className="relative group mt-2">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-medical-400 transition-colors duration-300 group-focus-within:text-medical-600" />
                  <input
                    type="password"
                    id="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="input pl-12 h-12 border-medical-200 focus:ring-4 focus:ring-medical-100"
                    aria-label="Mot de passe"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none group"
                aria-label="Connexion"
              >
                {isLoading ? (
                  <span className="inline-flex items-center">
                    <span className="h-4 w-4 mr-2 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Connexion en cours...
                  </span>
                ) : (
                  <span className="inline-flex items-center">
                    Se connecter
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                )}
              </button>
            </form>

            {showResetForm && (
              <div className="mt-6 p-4 rounded-xl border border-medical-100 bg-medical-50/60">
                <h3 className="text-sm font-semibold text-neutral-800 mb-2">Réinitialiser votre mot de passe</h3>
                <p className="text-xs text-neutral-600 mb-3">
                  Entrez votre e-mail pour recevoir un lien de réinitialisation sécurisé.
                </p>

                <form className="space-y-3" onSubmit={handleResetPassword}>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-medical-400 transition-colors duration-300 group-focus-within:text-medical-600" />
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(event) => setResetEmail(event.target.value)}
                      placeholder="votre@email.com"
                      className="input pl-12 h-11 border-medical-200 focus:ring-4 focus:ring-medical-100"
                      aria-label="E-mail de réinitialisation"
                    />
                  </div>

                  {resetMessage && (
                    <p className="text-xs text-health-700 bg-health-50 border border-health-200 rounded-lg p-2">
                      {resetMessage}
                    </p>
                  )}

                  {resetError && (
                    <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
                      {resetError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isResetLoading}
                    className="w-full h-10 rounded-xl bg-white border border-medical-200 text-medical-700 font-medium hover:border-medical-300 hover:bg-medical-50 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isResetLoading ? "Envoi en cours..." : "Envoyer le lien de réinitialisation"}
                  </button>
                </form>
              </div>
            )}

            <div className="mt-6 text-center space-y-3">
              <button
                type="button"
                onClick={() => {
                  setShowResetForm((previous) => !previous);
                  setResetEmail((previous) => previous || email);
                  setResetMessage("");
                  setResetError("");
                }}
                className="text-medical-600 hover:text-medical-700 text-sm font-medium transition-colors inline-flex items-center gap-1"
              >
                <Shield className="h-3.5 w-3.5" />
                {showResetForm ? "Masquer la réinitialisation" : "Mot de passe oublié ?"}
              </button>
              <div className="divider-medical"></div>
              <p className="text-neutral-600 text-sm">
                Pas encore de compte ?{" "}
                <a href="/register" className="text-medical-600 hover:text-medical-700 font-medium transition-colors">
                  Créer un compte
                </a>
              </p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-neutral-500">© 2026 HealthSync. Tous droits réservés.</p>
          </div>
        </div>
      </section>
    </div>
  );
}