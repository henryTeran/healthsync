import { useContext, useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  Building2,
  Camera,
  HeartPulse,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserCircle2,
} from "lucide-react";
import { getUserProfile, saveUserProfile, uploadProfilePicture } from "..";
import { AuthContext } from "../../../contexts/AuthContext";
import { ERROR_CODES } from "../../../shared/lib/errorCodes";
import { logError, logInfo, logWarn } from "../../../shared/lib/logger";
import { validateProfileForm } from "./profileFormValidation";

const initialFormValues = {
  lastName: "",
  firstName: "",
  age: "",
  dateOfBirth: "",
  gender: "",
  email: "",
  type: "",
  allergies: "",
  photoURL: null,
  mobileNumber: "",
  address: "",
  postalCode: "",
  state: "",
  country: "",
  status: "active",
  medicalLicense: "",
  education: "",
  department: "",
  designation: "",
  about: "",
};

const FieldError = ({ message }) => {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
};

FieldError.propTypes = {
  message: PropTypes.string,
};

const SectionCard = ({ icon: Icon, title, description, children }) => (
  <section className="rounded-[20px] border border-neutral-100 bg-white p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition">
    <div className="mb-4 flex items-start gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-medical-100 text-medical-700">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h3 className="text-base font-semibold text-neutral-900">{title}</h3>
        <p className="text-sm text-neutral-500">{description}</p>
      </div>
    </div>
    <div className="h-px bg-neutral-100 mb-4" />
    {children}
  </section>
);

SectionCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

const Input = ({ label, error, className = "", ...props }) => (
  <label className={`block ${className}`}>
    <span className="mb-1.5 block text-sm font-medium text-neutral-700">{label}</span>
    <input
      {...props}
      className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 shadow-sm outline-none transition focus:border-medical-400 focus:ring-4 focus:ring-medical-100"
    />
    <FieldError message={error} />
  </label>
);

Input.propTypes = {
  label: PropTypes.string.isRequired,
  error: PropTypes.string,
  className: PropTypes.string,
};

const TextArea = ({ label, error, className = "", ...props }) => (
  <label className={`block ${className}`}>
    <span className="mb-1.5 block text-sm font-medium text-neutral-700">{label}</span>
    <textarea
      {...props}
      className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 shadow-sm outline-none transition focus:border-medical-400 focus:ring-4 focus:ring-medical-100"
    />
    <FieldError message={error} />
  </label>
);

TextArea.propTypes = {
  label: PropTypes.string.isRequired,
  error: PropTypes.string,
  className: PropTypes.string,
};

const Select = ({ label, error, className = "", children, ...props }) => (
  <label className={`block ${className}`}>
    <span className="mb-1.5 block text-sm font-medium text-neutral-700">{label}</span>
    <select
      {...props}
      className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 shadow-sm outline-none transition focus:border-medical-400 focus:ring-4 focus:ring-medical-100"
    >
      {children}
    </select>
    <FieldError message={error} />
  </label>
);

Select.propTypes = {
  label: PropTypes.string.isRequired,
  error: PropTypes.string,
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
};

const normalizeDateValue = (value) => {
  if (!value) return "";
  const date = value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
};

export const EditProfile = ({ navigate }) => {
  const { user } = useContext(AuthContext);
  const [formValues, setFormValues] = useState(initialFormValues);
  const [formErrors, setFormErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const start = performance.now();

      try {
        if (!user?.uid) {
          setError("Utilisateur non connecté.");
          setIsLoading(false);
          logWarn("EditProfile: utilisateur absent", {
            code: ERROR_CODES.PROFILE.LOAD_FAILED,
            feature: "profile",
            action: "EditProfile.fetchUserProfile",
          });
          return;
        }

        const profileData = await getUserProfile(user.uid);
        const userType = profileData?.userType || profileData?.type || user.userType || "patient";

        setFormValues({
          ...initialFormValues,
          ...profileData,
          email: profileData?.email || user.email || "",
          type: profileData?.type || userType,
          userType,
          dateOfBirth: normalizeDateValue(profileData?.dateOfBirth),
        });
        setError("");

        logInfo("EditProfile chargé", {
          feature: "profile",
          action: "EditProfile.fetchUserProfile",
          userId: user.uid,
          durationMs: Math.round(performance.now() - start),
        });
      } catch (loadError) {
        setError(loadError.message || "Erreur lors du chargement du profil.");
        logError("Échec chargement EditProfile", loadError, {
          code: ERROR_CODES.PROFILE.LOAD_FAILED,
          feature: "profile",
          action: "EditProfile.fetchUserProfile",
          userId: user?.uid,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [user?.email, user?.uid, user?.userType]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormValues((previous) => ({ ...previous, [name]: value }));
    setFormErrors((previous) => ({ ...previous, [name]: "" }));
    setSuccessMessage("");
  };

  const handlePhotoUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedPhoto(file);
      setFormValues((previous) => ({ ...previous, photoURL: reader.result }));
      setSuccessMessage("");
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!user?.uid) return;

    const validation = validateProfileForm(formValues);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      setSuccessMessage("");
      logWarn("Validation profile échouée", {
        code: ERROR_CODES.APP.VALIDATION,
        feature: "profile",
        action: "EditProfile.handleSave",
        userId: user.uid,
        invalidFields: Object.keys(validation.errors),
      });
      return;
    }

    const start = performance.now();

    try {
      setIsSaving(true);
      setError("");
      setFormErrors({});

      let updatedPhotoURL = formValues.photoURL;
      if (selectedPhoto) {
        updatedPhotoURL = await uploadProfilePicture(user.uid, selectedPhoto);
      }

      await saveUserProfile(user.uid, {
        ...formValues,
        photoURL: updatedPhotoURL,
        dateOfBirth: formValues.dateOfBirth || null,
      });

      setSuccessMessage("Profil mis à jour avec succès.");
      logInfo("Profil mis à jour", {
        feature: "profile",
        action: "EditProfile.handleSave",
        userId: user.uid,
        durationMs: Math.round(performance.now() - start),
      });
    } catch (saveError) {
      setError(saveError.message || "Échec de mise à jour du profil.");
      logError("Échec mise à jour EditProfile", saveError, {
        code: ERROR_CODES.PROFILE.SAVE_FAILED,
        feature: "profile",
        action: "EditProfile.handleSave",
        userId: user.uid,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-medical-50/40 to-neutral-50 p-4 md:p-6 lg:p-8">
        <div className="rounded-[20px] border border-neutral-100 bg-white p-8 shadow-sm animate-pulse">
          <div className="mb-6 h-10 w-72 rounded bg-neutral-200" />
          <div className="mb-3 h-4 w-full rounded bg-neutral-100" />
          <div className="h-4 w-2/3 rounded bg-neutral-100" />
        </div>
      </div>
    );
  }

  const userType = formValues.userType || formValues.type || "patient";
  const roleLabel = userType === "doctor" ? "médecin" : "patient";
  const completionFields = [
    formValues.firstName,
    formValues.lastName,
    formValues.email,
    formValues.mobileNumber,
    formValues.country,
    userType === "doctor" ? formValues.medicalLicense : formValues.allergies,
  ];
  const completion = Math.round(
    (completionFields.filter((field) => String(field || "").trim().length > 0).length /
      completionFields.length) *
      100
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-medical-50/40 to-neutral-50 p-4 md:p-6 lg:p-8 space-y-6">
      <section className="rounded-[20px] border border-white/60 bg-white/90 backdrop-blur-sm shadow-medical p-6 md:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex flex-col gap-5 md:flex-row md:items-center">
              <div className="relative h-24 w-24 overflow-hidden rounded-2xl border-4 border-white shadow-md md:h-28 md:w-28">
                <img
                  src={formValues.photoURL || "/default-avatar.png"}
                  alt="Aperçu profil"
                  className="h-full w-full object-cover"
                />
                <label className="absolute bottom-2 right-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-white/90 text-medical-700 shadow-sm hover:bg-white">
                  <Camera className="h-4 w-4" />
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
              </div>

              <div className="space-y-3">
                <div>
                  <h1 className="text-3xl font-bold text-neutral-900 md:text-4xl">Modifier le profil {roleLabel}</h1>
                  <p className="text-sm text-neutral-500">Mettez à jour vos informations médicales et administratives.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-health-100 px-3 py-1 text-xs font-semibold text-health-700">
                    {userType === "doctor" ? "Profil professionnel" : "Profil patient"}
                  </span>
                  <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
                    Statut: {formValues.status || "active"}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:min-w-[420px]">
              <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
                <p className="text-xs text-neutral-500">Type de profil</p>
                <p className="text-xl font-semibold capitalize text-neutral-900">{roleLabel}</p>
              </div>
              <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
                <p className="text-xs text-neutral-500">Contact</p>
                <p className="break-all text-sm font-semibold text-neutral-900">{formValues.email || "Non renseigné"}</p>
              </div>
              <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
                <p className="text-xs text-neutral-500">Complétude</p>
                <p className="text-xl font-semibold text-neutral-900">{completion}%</p>
              </div>
            </div>
          </div>
        </section>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {successMessage && <div className="rounded-xl border border-health-200 bg-health-50 px-4 py-3 text-sm text-health-700">{successMessage}</div>}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <SectionCard icon={UserCircle2} title="Identité" description="Informations personnelles et administratives du profil.">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input label="Prenom" name="firstName" value={formValues.firstName} onChange={handleInputChange} error={formErrors.firstName} />
              <Input label="Nom" name="lastName" value={formValues.lastName} onChange={handleInputChange} error={formErrors.lastName} />
              <Input label="Age" name="age" type="number" min="0" value={formValues.age || ""} onChange={handleInputChange} error={formErrors.age} />
              <Input label="Date de naissance" name="dateOfBirth" type="date" value={formValues.dateOfBirth || ""} onChange={handleInputChange} />
              <Select label="Genre" name="gender" value={formValues.gender} onChange={handleInputChange} error={formErrors.gender}>
                <option value="">Selectionner</option>
                <option value="male">Masculin</option>
                <option value="female">Feminin</option>
              </Select>
              <Select label="Statut" name="status" value={formValues.status || "active"} onChange={handleInputChange}>
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
                <option value="pending">En attente</option>
              </Select>
              </div>
            </SectionCard>

            <SectionCard icon={Phone} title="Contact" description="Canaux de contact et localisation du profil.">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input label="Email" name="email" type="email" value={formValues.email} onChange={handleInputChange} error={formErrors.email} />
              <Input label="Telephone" name="mobileNumber" value={formValues.mobileNumber} onChange={handleInputChange} error={formErrors.mobileNumber} />
              <Input label="Adresse" name="address" value={formValues.address} onChange={handleInputChange} className="md:col-span-2" />
              <Input label="Code postal" name="postalCode" value={formValues.postalCode} onChange={handleInputChange} />
              <Input label="Ville" name="state" value={formValues.state} onChange={handleInputChange} />
              <Input label="Pays" name="country" value={formValues.country} onChange={handleInputChange} className="md:col-span-2" />
              </div>
            </SectionCard>

            {userType === "patient" && (
              <SectionCard icon={HeartPulse} title="Suivi médical" description="Informations cliniques essentielles pour le patient.">
                <div className="grid grid-cols-1 gap-4">
                  <TextArea
                    label="Allergies"
                    name="allergies"
                    rows="5"
                    value={formValues.allergies}
                    onChange={handleInputChange}
                    error={formErrors.allergies}
                  />
                </div>
              </SectionCard>
            )}

            {userType === "doctor" && (
              <SectionCard icon={Stethoscope} title="Suivi médical" description="Informations de pratique et éléments de confiance clinique.">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Input label="Licence medicale" name="medicalLicense" value={formValues.medicalLicense} onChange={handleInputChange} error={formErrors.medicalLicense} />
                  <Input label="Departement" name="department" value={formValues.department} onChange={handleInputChange} />
                  <Input label="Formation" name="education" value={formValues.education} onChange={handleInputChange} />
                  <Input label="Fonction" name="designation" value={formValues.designation} onChange={handleInputChange} />
                  <TextArea
                    label="A propos"
                    name="about"
                    rows="5"
                    value={formValues.about}
                    onChange={handleInputChange}
                    className="md:col-span-2"
                  />
                </div>
              </SectionCard>
            )}

            <section className="rounded-[20px] bg-white border border-neutral-100 p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-neutral-900">Enregistrer les modifications</p>
                  <p className="text-xs text-neutral-500">Les changements seront sauvegardés dans votre profil HealthSync.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 rounded-xl bg-health-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-health-700 disabled:opacity-60"
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? "Sauvegarde..." : "Sauvegarder"}
                  </button>
                </div>
              </div>
            </section>
          </div>

          <aside className="xl:col-span-1">
            <section className="rounded-[20px] border border-neutral-100 bg-white p-5 shadow-sm xl:sticky xl:top-24">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-medical-100 text-medical-700">
                  {userType === "doctor" ? <Building2 className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-neutral-900">Résumé du dossier</h3>
                  <p className="text-sm text-neutral-500">Vue synthétique des informations clés du profil.</p>
                </div>
              </div>
              <div className="h-px bg-neutral-100 mb-4" />

              <div className="space-y-3 text-sm">
                <div className="rounded-2xl bg-neutral-50 border border-neutral-100 p-4">
                  <p className="inline-flex items-center gap-1 text-xs text-neutral-500"><Mail className="h-3.5 w-3.5" /> Contact principal</p>
                  <p className="mt-2 break-all font-medium text-neutral-800">{formValues.email || "Non renseigné"}</p>
                </div>
                <div className="rounded-2xl bg-neutral-50 border border-neutral-100 p-4">
                  <p className="inline-flex items-center gap-1 text-xs text-neutral-500"><MapPin className="h-3.5 w-3.5" /> Localisation</p>
                  <p className="mt-2 font-medium text-neutral-800">{[formValues.state, formValues.country].filter(Boolean).join(", ") || "Non renseignée"}</p>
                </div>
                <div className="rounded-2xl bg-neutral-50 border border-neutral-100 p-4">
                  <p className="inline-flex items-center gap-1 text-xs text-neutral-500"><Sparkles className="h-3.5 w-3.5" /> Statut du profil</p>
                  <p className="mt-2 font-medium capitalize text-neutral-800">{formValues.status || "active"}</p>
                </div>
                <div className="rounded-2xl bg-neutral-50 border border-neutral-100 p-4">
                  <p className="inline-flex items-center gap-1 text-xs text-neutral-500"><ShieldCheck className="h-3.5 w-3.5" /> Type de suivi</p>
                  <p className="mt-2 font-medium text-neutral-800">{userType === "doctor" ? "Profil clinique" : "Profil de suivi"}</p>
                </div>
                <div className="rounded-2xl bg-neutral-50 border border-neutral-100 p-4">
                  <p className="text-xs text-neutral-500">Complétude du dossier</p>
                  <p className="mt-2 text-2xl font-semibold text-neutral-900">{completion}%</p>
                </div>
              </div>
            </section>
          </aside>
        </div>
    </div>
  );
};

EditProfile.propTypes = {
  navigate: PropTypes.func.isRequired,
};
