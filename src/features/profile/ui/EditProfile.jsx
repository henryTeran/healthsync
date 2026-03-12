import { Component } from "react";
import PropTypes from "prop-types";
import { getUserProfile, saveUserProfile, uploadProfilePicture } from "..";
import { AuthContext } from "../../../contexts/AuthContext";
import { ERROR_CODES } from "../../../shared/lib/errorCodes";
import { logError, logInfo, logWarn } from "../../../shared/lib/logger";
import { validateProfileForm } from "./profileFormValidation";

const initialFormValues = {
  lastName: "",
  firstName: "",
  age: "",
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
  status: "",
  medicalLicense: "",
  education: "",
  department: "",
  designation: "",
  about: "",
};

export class EditProfile extends Component {
  static contextType = AuthContext;

  constructor(props) {
    super(props);
    this.state = {
      user: null,
      formValues: initialFormValues,
      formErrors: {},
      isLoading: true,
      isSaving: false,
      error: "",
      successMessage: "",
    };
    this.inputPhoto = null;
  }

  componentDidMount() {
    this.fetchUserProfile();
  }

  fetchUserProfile = async () => {
    const start = performance.now();
    try {
      const { user } = this.context;
      if (!user?.uid) {
        this.setState({ error: "Utilisateur non connecté.", isLoading: false });
        logWarn("EditProfile: utilisateur absent", {
          code: ERROR_CODES.PROFILE.LOAD_FAILED,
          feature: "profile",
          action: "EditProfile.fetchUserProfile",
        });
        return;
      }

      const profileData = await getUserProfile(user.uid);
      const userType = profileData?.userType || profileData?.type || user.userType || "patient";

      this.setState({
        isLoading: false,
        user,
        formValues: {
          ...initialFormValues,
          ...profileData,
          email: profileData?.email || user.email || "",
          type: profileData?.type || userType,
          userType,
        },
        error: "",
      });

      logInfo("EditProfile chargé", {
        feature: "profile",
        action: "EditProfile.fetchUserProfile",
        userId: user.uid,
        durationMs: Math.round(performance.now() - start),
      });
    } catch (error) {
      this.setState({ error: error.message || "Erreur lors du chargement du profil.", isLoading: false });
      logError("Échec chargement EditProfile", error, {
        code: ERROR_CODES.PROFILE.LOAD_FAILED,
        feature: "profile",
        action: "EditProfile.fetchUserProfile",
      });
    }
  };

  handleInputChange = (event) => {
    const { name, value } = event.target;

    this.setState((previousState) => ({
      formValues: { ...previousState.formValues, [name]: value },
      formErrors: { ...previousState.formErrors, [name]: "" },
      successMessage: "",
    }));
  };

  handlePhotoUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      this.setState((previousState) => ({
        formValues: { ...previousState.formValues, photoURL: reader.result },
        successMessage: "",
      }));
    };
    reader.readAsDataURL(file);
  };

  handleSave = async () => {
    const { user, formValues } = this.state;
    if (!user?.uid) {
      return;
    }

    const validation = validateProfileForm(formValues);
    if (!validation.isValid) {
      this.setState({ formErrors: validation.errors, successMessage: "" });
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
      this.setState({ isSaving: true, error: "", formErrors: {} });

      let updatedPhotoURL = formValues.photoURL;
      if (this.inputPhoto?.files?.[0]) {
        updatedPhotoURL = await uploadProfilePicture(user.uid, this.inputPhoto.files[0]);
      }

      await saveUserProfile(user.uid, {
        ...formValues,
        photoURL: updatedPhotoURL,
      });

      this.setState({
        successMessage: "Profil mis à jour avec succès.",
      });

      logInfo("Profil mis à jour", {
        feature: "profile",
        action: "EditProfile.handleSave",
        userId: user.uid,
        durationMs: Math.round(performance.now() - start),
      });
    } catch (error) {
      this.setState({ error: error.message || "Échec de mise à jour du profil." });
      logError("Échec mise à jour EditProfile", error, {
        code: ERROR_CODES.PROFILE.SAVE_FAILED,
        feature: "profile",
        action: "EditProfile.handleSave",
        userId: user.uid,
      });
    } finally {
      this.setState({ isSaving: false });
    }
  };

  renderFieldError = (fieldName) => {
    const message = this.state.formErrors[fieldName];
    if (!message) {
      return null;
    }

    return <p className="mt-1 text-xs text-red-600">{message}</p>;
  };

  render() {
    const { isLoading, isSaving, error, successMessage, formValues } = this.state;

    if (isLoading) {
      return (
        <div className="p-6">
          <div className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse">
            <div className="h-6 w-56 bg-gray-200 rounded mb-6" />
            <div className="h-4 w-full bg-gray-100 rounded mb-3" />
            <div className="h-4 w-5/6 bg-gray-100 rounded mb-3" />
            <div className="h-4 w-2/3 bg-gray-100 rounded" />
          </div>
        </div>
      );
    }

    const userType = formValues.userType || formValues.type || "patient";

    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-2xl font-bold text-gray-900">Modifier le profil</h2>
          <p className="text-sm text-gray-500 mt-1">Mettez à jour vos informations {userType === "doctor" ? "professionnelles" : "personnelles"}.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-4">
            {successMessage}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
          <div>
            <label htmlFor="photo" className="block text-sm font-medium text-gray-700 mb-2">
              Photo de profil
            </label>
            <input
              type="file"
              id="photo"
              accept="image/*"
              onChange={this.handlePhotoUpload}
              ref={(input) => {
                this.inputPhoto = input;
              }}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
            {formValues.photoURL && (
              <img
                src={formValues.photoURL}
                alt="Aperçu du profil"
                className="mt-3 w-24 h-24 object-cover rounded-full border border-gray-200"
              />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">Prénom*</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formValues.firstName}
                onChange={this.handleInputChange}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              />
              {this.renderFieldError("firstName")}
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Nom*</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formValues.lastName}
                onChange={this.handleInputChange}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              />
              {this.renderFieldError("lastName")}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email*</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formValues.email}
                onChange={this.handleInputChange}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              />
              {this.renderFieldError("email")}
            </div>

            <div>
              <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-700">Téléphone</label>
              <input
                type="text"
                id="mobileNumber"
                name="mobileNumber"
                value={formValues.mobileNumber}
                onChange={this.handleInputChange}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              />
              {this.renderFieldError("mobileNumber")}
            </div>

            <div>
              <label htmlFor="age" className="block text-sm font-medium text-gray-700">Âge</label>
              <input
                type="number"
                id="age"
                name="age"
                min="0"
                value={formValues.age || ""}
                onChange={this.handleInputChange}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              />
              {this.renderFieldError("age")}
            </div>

            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700">Genre*</label>
              <select
                id="gender"
                name="gender"
                value={formValues.gender}
                onChange={this.handleInputChange}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="">Sélectionner</option>
                <option value="male">Masculin</option>
                <option value="female">Féminin</option>
              </select>
              {this.renderFieldError("gender")}
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">Adresse</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formValues.address}
                onChange={this.handleInputChange}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700">Ville</label>
              <input
                type="text"
                id="state"
                name="state"
                value={formValues.state}
                onChange={this.handleInputChange}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">Code postal</label>
              <input
                type="text"
                id="postalCode"
                name="postalCode"
                value={formValues.postalCode}
                onChange={this.handleInputChange}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700">Pays</label>
              <input
                type="text"
                id="country"
                name="country"
                value={formValues.country}
                onChange={this.handleInputChange}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
          </div>

          {userType === "patient" && (
            <div>
              <label htmlFor="allergies" className="block text-sm font-medium text-gray-700">Allergies</label>
              <textarea
                id="allergies"
                name="allergies"
                rows="3"
                value={formValues.allergies}
                onChange={this.handleInputChange}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
          )}

          {userType === "doctor" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="medicalLicense" className="block text-sm font-medium text-gray-700">Licence médicale</label>
                <input
                  type="text"
                  id="medicalLicense"
                  name="medicalLicense"
                  value={formValues.medicalLicense}
                  onChange={this.handleInputChange}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                />
                {this.renderFieldError("medicalLicense")}
              </div>

              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700">Département</label>
                <input
                  type="text"
                  id="department"
                  name="department"
                  value={formValues.department}
                  onChange={this.handleInputChange}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>

              <div>
                <label htmlFor="education" className="block text-sm font-medium text-gray-700">Éducation</label>
                <input
                  type="text"
                  id="education"
                  name="education"
                  value={formValues.education}
                  onChange={this.handleInputChange}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>

              <div>
                <label htmlFor="designation" className="block text-sm font-medium text-gray-700">Fonction</label>
                <input
                  type="text"
                  id="designation"
                  name="designation"
                  value={formValues.designation}
                  onChange={this.handleInputChange}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="about" className="block text-sm font-medium text-gray-700">À propos</label>
                <textarea
                  id="about"
                  name="about"
                  rows="4"
                  value={formValues.about}
                  onChange={this.handleInputChange}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={this.handleSave}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-md bg-health-600 text-white hover:bg-health-700 disabled:opacity-60"
            >
              {isSaving ? "Sauvegarde..." : "Sauvegarder"}
            </button>
          </div>
        </div>
      </div>
    );
  }
}

EditProfile.propTypes = {
  navigate: PropTypes.func.isRequired,
};
