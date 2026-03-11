import { useContext, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Bot,
  CheckCircle2,
  FileCheck2,
  MessageSquareHeart,
  Shield,
  Stethoscope,
  UserPlus,
} from "lucide-react";
import { RegistrationService } from "../../../features/auth";
import { saveUserProfile, uploadProfilePicture } from "../../../features/profile";
import { AuthContext } from "../../../contexts/AuthContext";
import { AdditionalSection, ConnectionSection, PersonalSection } from "./RegisterSections";

const initialFormData = {
  role: "patient",
  email: "",
  password: "",
  confirmPassword: "",
  firstName: "",
  lastName: "",
  age: null,
  dateOfBirth: "",
  gender: "Masculin",
  mobileNumber: "",
  address: "",
  postalCode: "",
  state: "",
  country: "Suisse",
  status: "Actif",
  type: "patient",
  photoURL: "",
  allergies: "",
  medicalLicense: "",
  education: "",
  department: "",
  designation: "",
  about: "",
};

export function Register() {
  const [formData, setFormData] = useState(initialFormData);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [toast, setToast] = useState({ type: "", message: "" });
  const navigate = useNavigate();
  const inputPhotoRef = useRef(null);
  const { register } = useContext(AuthContext);

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const stepLabels = [
    { id: 1, title: "Connexion", subtitle: "Sécurité du compte" },
    { id: 2, title: "Profil", subtitle: "Informations personnelles" },
    { id: 3, title: "Médical", subtitle: "Infos complémentaires" },
  ];

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast({ type: "", message: "" });
    }, 3500);
  };

  const validateStep = (targetStep) => {
    const errors = {};

    if (targetStep === 1) {
      if (!formData.email?.trim()) errors.email = "Adresse e-mail requise";
      if (!formData.password?.trim()) errors.password = "Mot de passe requis";
      if (!formData.confirmPassword?.trim()) {
        errors.confirmPassword = "Confirmation requise";
      }
      if (formData.password && formData.password.length < 8) {
        errors.password = "8 caractères minimum";
      }
      if (
        formData.password &&
        formData.confirmPassword &&
        formData.password !== formData.confirmPassword
      ) {
        errors.confirmPassword = "Les mots de passe ne correspondent pas";
      }
    }

    if (targetStep === 2) {
      if (!formData.role?.trim()) errors.role = "Rôle requis";
      if (!formData.gender?.trim()) errors.gender = "Genre requis";
      if (!formData.firstName?.trim()) errors.firstName = "Prénom requis";
      if (!formData.lastName?.trim()) errors.lastName = "Nom requis";
    }

    if (targetStep === 3) {
      if (!formData.country?.trim()) errors.country = "Pays requis";
      if (!formData.status?.trim()) errors.status = "Statut requis";
      if (formData.role === "doctor" && !formData.medicalLicense?.trim()) {
        errors.medicalLicense = "Licence médicale requise";
      }
    }

    return errors;
  };

  const validateCurrentStep = () => {
    const currentStepErrors = validateStep(step);
    setFieldErrors(currentStepErrors);
    return Object.keys(currentStepErrors).length === 0;
  };

  const validateAllSteps = () => {
    const allErrors = {
      ...validateStep(1),
      ...validateStep(2),
      ...validateStep(3),
    };
    setFieldErrors(allErrors);
    return Object.keys(allErrors).length === 0;
  };

  const handleNextStep = () => {
    setError("");
    const isStepValid = validateCurrentStep();
    if (!isStepValid) {
      showToast("error", "Veuillez corriger les champs requis avant de continuer.");
      return;
    }
    setStep((previous) => Math.min(previous + 1, totalSteps));
  };

  const handlePreviousStep = () => {
    setError("");
    setStep((previous) => Math.max(previous - 1, 1));
  };

  const handleRegister = async (event) => {
    event.preventDefault();

    if (!validateAllSteps()) {
      showToast("error", "Le formulaire contient des erreurs. Vérifiez les champs et réessayez.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const updatedFormData = {
        ...formData,
        role: formData.role.toLowerCase(),
        type: formData.role.toLowerCase(),
      };

      const validate = RegistrationService.register(updatedFormData, updatedFormData.confirmPassword);
      if (!validate.success) {
        setError(validate.errors.join("\n"));
        showToast("error", "Impossible de créer le compte. Vérifiez les informations saisies.");
        return;
      }

      const userCredentialId = await register(updatedFormData.email, updatedFormData.password);

      let updatedPhotoURL = updatedFormData.photoURL;
      if (inputPhotoRef.current?.files?.[0]) {
        updatedPhotoURL = await uploadProfilePicture(userCredentialId, inputPhotoRef.current.files[0]);
      }

      await saveUserProfile(userCredentialId, {
        ...updatedFormData,
        id: userCredentialId,
        photoURL: updatedPhotoURL,
      });

      setIsSuccess(true);
      showToast("success", "Compte créé avec succès. Redirection en cours...");
      setTimeout(() => {
        navigate("/dashboard");
      }, 1300);
    } catch (registrationError) {
      console.error("Erreur d'inscription :", registrationError);
      const errorMessage = registrationError?.message || "Erreur inattendue lors de l'inscription.";
      setError(errorMessage);
      showToast("error", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormKeyDown = (event) => {
    if (event.key !== "Enter" || event.shiftKey || isSubmitting) {
      return;
    }

    const tagName = event.target.tagName?.toLowerCase();
    if (tagName === "textarea") {
      return;
    }

    event.preventDefault();

    if (step < totalSteps) {
      handleNextStep();
      return;
    }

    handleRegister(event);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFieldErrors((previous) => ({ ...previous, [name]: undefined }));
    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const handlePhotoUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((previousData) => ({
        ...previousData,
        photoURL: reader.result,
      }));
    };
    reader.readAsDataURL(file);
  };

  const renderCurrentStep = () => {
    if (step === 1) {
      return (
        <ConnectionSection
          error={error}
          formData={formData}
          onChange={handleChange}
          fieldErrors={fieldErrors}
        />
      );
    }

    if (step === 2) {
      return (
        <PersonalSection
          formData={formData}
          onChange={handleChange}
          fieldErrors={fieldErrors}
        />
      );
    }

    return (
      <AdditionalSection
        formData={formData}
        inputPhotoRef={inputPhotoRef}
        onChange={handleChange}
        onPhotoUpload={handlePhotoUpload}
        fieldErrors={fieldErrors}
      />
    );
  };

  return (
    <div className="min-h-screen bg-mesh flex flex-col lg:flex-row">
      {toast.message && (
        <div
          role="alert"
          aria-live="assertive"
          className={`fixed top-4 right-4 z-50 max-w-sm rounded-xl border px-4 py-3 shadow-xl transition-all duration-300 ${
            toast.type === "success"
              ? "border-health-200 bg-health-50 text-health-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          <p className="text-sm font-medium">{toast.message}</p>
        </div>
      )}

      <section className="relative lg:w-3/5 h-[360px] lg:h-auto overflow-hidden bg-gradient-to-br from-blue-600 via-cyan-500 to-violet-500 p-8 lg:p-12 text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10 h-full flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/15 backdrop-blur-xl border border-white/20 shadow-xl">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Stethoscope className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold tracking-wide">HealthSync</p>
                <p className="text-xs text-white/80">Plateforme HealthTech sécurisée</p>
              </div>
            </div>

            <h1 className="mt-8 text-3xl lg:text-5xl font-bold leading-tight max-w-xl">
              Votre santé connectée commence ici
            </h1>
            <p className="mt-5 text-base lg:text-lg text-white/90 max-w-xl leading-relaxed">
              Suivi médical intelligent, communication sécurisée avec les médecins et gestion simplifiée des traitements.
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
        <div className="w-full max-w-xl card-medical p-6 sm:p-8 rounded-3xl border border-white/50 shadow-2xl transition-all duration-300 hover:-translate-y-0.5">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-medical-50 border border-medical-100 flex items-center justify-center shadow-soft">
              <UserPlus className="h-8 w-8 text-medical-600" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-800 mt-4">Créer votre compte</h2>
            <p className="text-neutral-600 mt-1">Configurez votre espace HealthSync en quelques étapes.</p>
          </div>

          <div className="mb-6">
            <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {stepLabels.map((item) => (
                <div key={item.id} className="text-center">
                  <div
                    className={`mx-auto w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                      item.id <= step
                        ? "bg-medical-500 text-white shadow-soft"
                        : "bg-neutral-100 text-neutral-500"
                    }`}
                  >
                    {item.id}
                  </div>
                  <p className="mt-2 text-xs font-medium text-neutral-700">{item.title}</p>
                  <p className="text-[11px] text-neutral-500">{item.subtitle}</p>
                </div>
              ))}
            </div>
          </div>

          {isSuccess ? (
            <div className="rounded-2xl border border-health-200 bg-health-50 p-8 text-center animate-[pulse_1.8s_ease-in-out_infinite]">
              <CheckCircle2 className="h-12 w-12 text-health-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-health-700">Compte créé avec succès</h3>
              <p className="text-sm text-health-700/80 mt-1">Redirection vers votre tableau de bord...</p>
            </div>
          ) : (
            <form onSubmit={handleRegister} onKeyDown={handleFormKeyDown} className="space-y-6">
              <div key={step} className="animate-[pulse_0.35s_ease-out_1]">
                {renderCurrentStep()}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handlePreviousStep}
                  disabled={step === 1 || isSubmitting}
                  className="btn-ghost flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </button>

                {step < totalSteps ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={isSubmitting}
                    className="btn-primary flex-1 group"
                  >
                    Suivant
                    <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none group"
                  >
                    {isSubmitting ? (
                      <span className="inline-flex items-center">
                        <span className="h-4 w-4 mr-2 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Création en cours...
                      </span>
                    ) : (
                      <span className="inline-flex items-center">
                        Créer mon espace sécurisé
                        <Shield className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
                      </span>
                    )}
                  </button>
                )}
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <div className="divider-medical" />
            <p className="text-sm text-neutral-600 mt-4">
              Déjà membre ?{" "}
              <a href="/login" className="text-medical-600 hover:text-medical-700 font-medium transition-colors">
                Se connecter
              </a>
            </p>
          </div>

          <div className="mt-5 text-center text-xs text-neutral-500">
            © 2026 HealthSync · Expérience SaaS Médicale Premium
          </div>
        </div>
      </section>
    </div>
  );
}