import PropTypes from "prop-types";

export const ConnectionSection = ({ error, formData, onChange }) => (
  <div className="mb-8">
    <h3 className="text-lg font-semibolt mb-4">Informations de connexion</h3>
    {error && <p className="text-red-500 mb-4">{error}</p>}

    <div className="space-y-4">
      <div>
        <label htmlFor="email" className="sr-only">
          Email*
        </label>
        <input
          type="email"
          id="email"
          placeholder="Email*"
          name="email"
          value={formData.email}
          onChange={onChange}
          required
          className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
        />
      </div>

      <div>
        <label htmlFor="password" className="sr-only">
          Mot de passe*
        </label>
        <input
          type="password"
          id="password"
          placeholder="Mot de passe*"
          name="password"
          value={formData.password}
          onChange={onChange}
          required
          className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="sr-only">
          Confirmez le mot de passe*
        </label>
        <input
          type="password"
          id="confirmPassword"
          placeholder="Confirmez le mot de passe*"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={onChange}
          required
          className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
        />
      </div>
    </div>
  </div>
);

export const PersonalSection = ({ formData, onChange }) => (
  <div className="mb-8">
    <h3 className="text-lg font-semibold mb-4">Informations personnelles</h3>

    <div className="mb-4">
      <label htmlFor="role" className="sr-only">
        Role*
      </label>
      <select
        id="role"
        name="role"
        value={formData.role}
        onChange={onChange}
        required
        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
      >
        <option value="patient">Patient</option>
        <option value="doctor">Medecin</option>
      </select>
    </div>

    <div className="mb-4">
      <label htmlFor="gender" className="sr-only">
        Genre*
      </label>
      <select
        id="gender"
        name="gender"
        value={formData.gender}
        onChange={onChange}
        required
        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
      >
        <option value="Masculin">Masculin</option>
        <option value="Feminin">Feminin</option>
      </select>
    </div>

    <div className="mb-4">
      <label htmlFor="firstName" className="sr-only">
        Prenom*
      </label>
      <input
        type="text"
        id="firstName"
        placeholder="Prenom*"
        name="firstName"
        value={formData.firstName}
        onChange={onChange}
        required
        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
      />
    </div>

    <div className="mb-4">
      <label htmlFor="lastName" className="sr-only">
        Nom*
      </label>
      <input
        type="text"
        id="lastName"
        placeholder="Nom*"
        name="lastName"
        value={formData.lastName}
        onChange={onChange}
        required
        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
      />
    </div>

    <div className="mb-4">
      <label htmlFor="age" className="sr-only">
        Age
      </label>
      <input
        type="number"
        id="age"
        placeholder="Age"
        name="age"
        value={formData.age || ""}
        onChange={onChange}
        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
      />
    </div>

    <div className="mb-4">
      <label htmlFor="dateOfBirth" className="sr-only">
        Date de naissance
      </label>
      <input
        type="date"
        id="dateOfBirth"
        name="dateOfBirth"
        value={formData.dateOfBirth}
        onChange={onChange}
        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
      />
    </div>
  </div>
);

export const AdditionalSection = ({ formData, inputPhotoRef, onChange, onPhotoUpload }) => (
  <div className="mb-8">
    <div className="text-lg font-semibold mb-11"></div>

    <div className="mb-4">
      <label htmlFor="mobileNumber" className="sr-only">
        Numero de telephone
      </label>
      <input
        type="text"
        placeholder="Numero de telephone"
        id="mobileNumber"
        name="mobileNumber"
        value={formData.mobileNumber}
        onChange={onChange}
        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
      />
    </div>

    <div className="mb-4">
      <label htmlFor="address" className="sr-only">
        Adresse
      </label>
      <input
        type="text"
        id="address"
        placeholder="Adresse"
        name="address"
        value={formData.address}
        onChange={onChange}
        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
      />
    </div>

    <div className="mb-4">
      <label htmlFor="postalCode" className="sr-only">
        Code postal
      </label>
      <input
        type="text"
        id="postalCode"
        placeholder="Code postal"
        name="postalCode"
        value={formData.postalCode}
        onChange={onChange}
        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
      />
    </div>

    <div className="mb-4">
      <label htmlFor="state" className="sr-only">
        Ville
      </label>
      <input
        type="text"
        id="state"
        placeholder="Ville"
        name="state"
        value={formData.state}
        onChange={onChange}
        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
      />
    </div>

    <div className="mb-4">
      <label htmlFor="country" className="sr-only">
        Pays
      </label>
      <input
        type="text"
        placeholder="Pays"
        id="country"
        name="country"
        value={formData.country}
        onChange={onChange}
        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
      />
    </div>

    <div className="mb-4">
      <label htmlFor="status" className="sr-only">
        Statut*
      </label>
      <select
        id="status"
        name="status"
        value={formData.status}
        onChange={onChange}
        required
        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
      >
        <option value="Actif">Actif</option>
        <option value="Non actif">Non actif</option>
      </select>
    </div>

    <div className="mb-4">
      <label htmlFor="photoURL" className="sr-only">
        Photo de profil*
      </label>
      <input
        type="file"
        id="photoURL"
        ref={inputPhotoRef}
        onChange={onPhotoUpload}
        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
      />
    </div>

    {formData.role === "patient" && (
      <div className="mb-4">
        <label htmlFor="allergies" className="sr-only">
          Allergies
        </label>
        <textarea
          id="allergies"
          placeholder="Allergies"
          name="allergies"
          value={formData.allergies}
          onChange={onChange}
          rows="3"
          className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
        />
      </div>
    )}

    {formData.role === "doctor" && (
      <>
        <div className="mb-4">
          <label htmlFor="medicalLicense" className="sr-only">
            Licence medicale
          </label>
          <input
            type="text"
            placeholder="Licence medicale"
            id="medicalLicense"
            name="medicalLicense"
            value={formData.medicalLicense}
            onChange={onChange}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="education" className="sr-only">
            Education
          </label>
          <input
            type="text"
            id="education"
            placeholder="Education"
            name="education"
            value={formData.education}
            onChange={onChange}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="department" className="sr-only">
            Departement
          </label>
          <input
            type="text"
            id="department"
            placeholder="Departement"
            name="department"
            value={formData.department}
            onChange={onChange}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="designation" className="sr-only">
            Fonction
          </label>
          <input
            type="text"
            placeholder="Fonction"
            id="designation"
            name="designation"
            value={formData.designation}
            onChange={onChange}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="about" className="sr-only">
            A propos
          </label>
          <textarea
            id="about"
            placeholder="A propos"
            name="about"
            value={formData.about}
            onChange={onChange}
            rows="3"
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          />
        </div>
      </>
    )}
  </div>
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
};

PersonalSection.propTypes = {
  formData: formDataShape.isRequired,
  onChange: PropTypes.func.isRequired,
};

AdditionalSection.propTypes = {
  formData: formDataShape.isRequired,
  inputPhotoRef: PropTypes.shape({ current: PropTypes.any }),
  onChange: PropTypes.func.isRequired,
  onPhotoUpload: PropTypes.func.isRequired,
};