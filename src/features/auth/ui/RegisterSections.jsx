import PropTypes from "prop-types";
import {
  BadgeCheck,
  BriefcaseMedical,
  Calendar,
  FileText,
  Globe,
  HeartPulse,
  IdCard,
  Mail,
  MapPin,
  Phone,
  Shield,
  User,
  UserRound,
  VenusAndMars,
  GraduationCap,
  Lock,
  KeyRound,
} from "lucide-react";

const cardClass = "rounded-2xl border border-medical-100 bg-white/70 backdrop-blur-md p-5 shadow-soft";
const inputBaseClass = "peer h-14 w-full rounded-xl border bg-white px-4 pl-12 text-sm text-neutral-800 placeholder-transparent outline-none transition-all duration-300 focus:ring-4";

const FloatingInput = ({
  id,
  name,
  label,
  value,
  onChange,
  error,
  required,
  type = "text",
  Icon,
}) => (
  <div className="space-y-1">
    <div className="relative group">
      <Icon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-medical-400 transition-colors duration-300 group-focus-within:text-medical-600" />
      <input
        id={id}
        name={name}
        type={type}
        value={value ?? ""}
        onChange={onChange}
        required={required}
        placeholder={label}
        className={`${inputBaseClass} ${
          error
            ? "border-red-300 focus:border-red-400 focus:ring-red-100"
            : "border-medical-200 focus:border-medical-400 focus:ring-medical-100"
        }`}
      />
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-12 top-1/2 -translate-y-1/2 bg-white px-1 text-sm text-neutral-500 transition-all duration-300 peer-placeholder-shown:top-1/2 peer-focus:top-0 peer-focus:text-xs peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-xs"
      >
        {label}
      </label>
    </div>
    {error && <p className="text-xs text-red-500 ml-1">{error}</p>}
  </div>
);

const SelectInput = ({ id, name, label, value, onChange, error, required, Icon, options }) => (
  <div className="space-y-1">
    <label htmlFor={id} className="text-sm font-medium text-neutral-700 inline-flex items-center gap-2">
      <Icon className="h-4 w-4 text-medical-500" />
      {label}
    </label>
    <select
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className={`h-12 w-full rounded-xl border bg-white px-4 text-sm text-neutral-800 outline-none transition-all duration-300 focus:ring-4 ${
        error
          ? "border-red-300 focus:border-red-400 focus:ring-red-100"
          : "border-medical-200 focus:border-medical-400 focus:ring-medical-100"
      }`}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {error && <p className="text-xs text-red-500 ml-1">{error}</p>}
  </div>
);

const TextAreaInput = ({ id, name, label, value, onChange, error, Icon, rows = 3 }) => (
  <div className="space-y-1">
    <label htmlFor={id} className="text-sm font-medium text-neutral-700 inline-flex items-center gap-2">
      <Icon className="h-4 w-4 text-medical-500" />
      {label}
    </label>
    <textarea
      id={id}
      name={name}
      value={value ?? ""}
      onChange={onChange}
      rows={rows}
      className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-neutral-800 outline-none transition-all duration-300 focus:ring-4 ${
        error
          ? "border-red-300 focus:border-red-400 focus:ring-red-100"
          : "border-medical-200 focus:border-medical-400 focus:ring-medical-100"
      }`}
    />
    {error && <p className="text-xs text-red-500 ml-1">{error}</p>}
  </div>
);

export const ConnectionSection = ({ error, formData, onChange, fieldErrors }) => (
  <section className={cardClass}>
    <h3 className="text-lg font-semibold text-neutral-800 mb-1">Étape 1 · Login Info</h3>
    <p className="text-sm text-neutral-600 mb-5">Sécurisez votre accès à votre espace HealthSync.</p>

    {error && (
      <div className="mb-4 p-3 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm whitespace-pre-line">
        {error}
      </div>
    )}

    <div className="space-y-4">
      <FloatingInput
        id="email"
        name="email"
        label="Adresse e-mail"
        value={formData.email}
        onChange={onChange}
        error={fieldErrors?.email}
        required
        type="email"
        Icon={Mail}
      />

      <FloatingInput
        id="password"
        name="password"
        label="Mot de passe"
        value={formData.password}
        onChange={onChange}
        error={fieldErrors?.password}
        required
        type="password"
        Icon={Lock}
      />

      <FloatingInput
        id="confirmPassword"
        name="confirmPassword"
        label="Confirmation"
        value={formData.confirmPassword}
        onChange={onChange}
        error={fieldErrors?.confirmPassword}
        required
        type="password"
        Icon={KeyRound}
      />

      <div className="rounded-xl bg-medical-50 border border-medical-100 p-3 text-xs text-medical-700 flex items-start gap-2">
        <Shield className="h-4 w-4 mt-0.5" />
        Les mots de passe sont chiffrés et protégés selon les standards de sécurité médicale.
      </div>
    </div>
  </section>
);

export const PersonalSection = ({ formData, onChange, fieldErrors }) => (
  <section className={cardClass}>
    <h3 className="text-lg font-semibold text-neutral-800 mb-1">Étape 2 · Personal Info</h3>
    <p className="text-sm text-neutral-600 mb-5">Renseignez votre identité pour personnaliser l&apos;expérience.</p>

    <div className="space-y-4">
      <SelectInput
        id="role"
        name="role"
        label="Rôle"
        value={formData.role}
        onChange={onChange}
        error={fieldErrors?.role}
        required
        Icon={BadgeCheck}
        options={[
          { value: "patient", label: "Patient" },
          { value: "doctor", label: "Médecin" },
        ]}
      />

      <SelectInput
        id="gender"
        name="gender"
        label="Genre"
        value={formData.gender}
        onChange={onChange}
        error={fieldErrors?.gender}
        required
        Icon={VenusAndMars}
        options={[
          { value: "Masculin", label: "Masculin" },
          { value: "Feminin", label: "Féminin" },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FloatingInput
          id="firstName"
          name="firstName"
          label="Prénom"
          value={formData.firstName}
          onChange={onChange}
          error={fieldErrors?.firstName}
          required
          Icon={UserRound}
        />

        <FloatingInput
          id="lastName"
          name="lastName"
          label="Nom"
          value={formData.lastName}
          onChange={onChange}
          error={fieldErrors?.lastName}
          required
          Icon={User}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FloatingInput
          id="age"
          name="age"
          label="Âge"
          value={formData.age || ""}
          onChange={onChange}
          error={fieldErrors?.age}
          type="number"
          Icon={IdCard}
        />

        <FloatingInput
          id="dateOfBirth"
          name="dateOfBirth"
          label="Date de naissance"
          value={formData.dateOfBirth}
          onChange={onChange}
          error={fieldErrors?.dateOfBirth}
          type="date"
          Icon={Calendar}
        />
      </div>
    </div>
  </section>
);

export const AdditionalSection = ({
  formData,
  inputPhotoRef,
  onChange,
  onPhotoUpload,
  fieldErrors,
}) => (
  <section className={cardClass}>
    <h3 className="text-lg font-semibold text-neutral-800 mb-1">Étape 3 · Medical Info</h3>
    <p className="text-sm text-neutral-600 mb-5">Finalisez votre profil médical et vos préférences.</p>

    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FloatingInput
          id="mobileNumber"
          name="mobileNumber"
          label="Téléphone"
          value={formData.mobileNumber}
          onChange={onChange}
          error={fieldErrors?.mobileNumber}
          Icon={Phone}
        />

        <FloatingInput
          id="postalCode"
          name="postalCode"
          label="Code postal"
          value={formData.postalCode}
          onChange={onChange}
          error={fieldErrors?.postalCode}
          Icon={MapPin}
        />
      </div>

      <FloatingInput
        id="address"
        name="address"
        label="Adresse"
        value={formData.address}
        onChange={onChange}
        error={fieldErrors?.address}
        Icon={MapPin}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FloatingInput
          id="state"
          name="state"
          label="Ville"
          value={formData.state}
          onChange={onChange}
          error={fieldErrors?.state}
          Icon={Globe}
        />

        <FloatingInput
          id="country"
          name="country"
          label="Pays"
          value={formData.country}
          onChange={onChange}
          error={fieldErrors?.country}
          required
          Icon={Globe}
        />
      </div>

      <SelectInput
        id="status"
        name="status"
        label="Statut"
        value={formData.status}
        onChange={onChange}
        error={fieldErrors?.status}
        required
        Icon={BadgeCheck}
        options={[
          { value: "Actif", label: "Actif" },
          { value: "Non actif", label: "Non actif" },
        ]}
      />

      <div className="space-y-1">
        <label htmlFor="photoURL" className="text-sm font-medium text-neutral-700 inline-flex items-center gap-2">
          <User className="h-4 w-4 text-medical-500" />
          Photo de profil
        </label>
        <input
          type="file"
          id="photoURL"
          ref={inputPhotoRef}
          onChange={onPhotoUpload}
          className="w-full text-sm text-neutral-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-medical-50 file:text-medical-700 hover:file:bg-medical-100"
        />
      </div>

      {formData.role === "patient" && (
        <TextAreaInput
          id="allergies"
          name="allergies"
          label="Allergies"
          value={formData.allergies}
          onChange={onChange}
          error={fieldErrors?.allergies}
          Icon={HeartPulse}
        />
      )}

      {formData.role === "doctor" && (
        <>
          <FloatingInput
            id="medicalLicense"
            name="medicalLicense"
            label="Licence médicale"
            value={formData.medicalLicense}
            onChange={onChange}
            error={fieldErrors?.medicalLicense}
            Icon={BriefcaseMedical}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FloatingInput
              id="education"
              name="education"
              label="Éducation"
              value={formData.education}
              onChange={onChange}
              error={fieldErrors?.education}
              Icon={GraduationCap}
            />

            <FloatingInput
              id="department"
              name="department"
              label="Département"
              value={formData.department}
              onChange={onChange}
              error={fieldErrors?.department}
              Icon={BriefcaseMedical}
            />
          </div>

          <FloatingInput
            id="designation"
            name="designation"
            label="Fonction"
            value={formData.designation}
            onChange={onChange}
            error={fieldErrors?.designation}
            Icon={IdCard}
          />

          <TextAreaInput
            id="about"
            name="about"
            label="Présentation"
            value={formData.about}
            onChange={onChange}
            error={fieldErrors?.about}
            Icon={FileText}
          />
        </>
      )}
    </div>
  </section>
);

const formDataShape = PropTypes.shape({
  role: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
  password: PropTypes.string.isRequired,
  confirmPassword: PropTypes.string.isRequired,
  firstName: PropTypes.string.isRequired,
  lastName: PropTypes.string.isRequired,
  age: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  dateOfBirth: PropTypes.string,
  gender: PropTypes.string.isRequired,
  mobileNumber: PropTypes.string,
  address: PropTypes.string,
  postalCode: PropTypes.string,
  state: PropTypes.string,
  country: PropTypes.string.isRequired,
  status: PropTypes.string.isRequired,
  photoURL: PropTypes.string,
  allergies: PropTypes.string,
  medicalLicense: PropTypes.string,
  education: PropTypes.string,
  department: PropTypes.string,
  designation: PropTypes.string,
  about: PropTypes.string,
});

ConnectionSection.propTypes = {
  error: PropTypes.string,
  formData: formDataShape.isRequired,
  onChange: PropTypes.func.isRequired,
  fieldErrors: PropTypes.object,
};

PersonalSection.propTypes = {
  formData: formDataShape.isRequired,
  onChange: PropTypes.func.isRequired,
  fieldErrors: PropTypes.object,
};

AdditionalSection.propTypes = {
  formData: formDataShape.isRequired,
  inputPhotoRef: PropTypes.shape({ current: PropTypes.any }),
  onChange: PropTypes.func.isRequired,
  onPhotoUpload: PropTypes.func.isRequired,
  fieldErrors: PropTypes.object,
};