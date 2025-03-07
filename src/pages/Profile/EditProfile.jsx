// src/pages/EditProfile.jsx
import React, { Component } from "react";
import { getUserProfile, saveUserProfile, uploadProfilePicture } from "../../services/profileService";
import { AuthContext } from "../../contexts/AuthContext";
import PropTypes from "prop-types";



export class EditProfile extends Component {
    
  constructor(props) {
    super(props);
    this.state = {
      user: null,
      formValues: {
        lastName: "",
        firstName: "",
        age: "",
        gender: "",
        email: "",
        type: "",
        allergies: "", // Spécifique aux patients
        photoURL: null,
        mobileNumber: "", // Numéro de téléphone
        address: "", // Adresse
        postalCode: "", // Code postal
        state: "", // Ville
        country: "", // Pays
        status: "", // Statut (Actif/Non actif)
        medicalLicense: "", // Spécifique aux médecins
        education: "", // Spécifique aux médecins
        department: "", // Spécifique aux médecins
        designation: "", // Spécifique aux médecins
        about: "", // Spécifique aux médecins
      },
      isLoading: true,
      error: "",
    };
    this.inputPhoto = null;
  }

  static contextType = AuthContext;
  

  componentDidMount() {
    this.fetchUserProfile();
  }

  fetchUserProfile = async () => {
    try {
      const { user } = this.context;
      if (!user) {
        this.setState({ error: "Utilisateur non connecté.", isLoading: false });
        return;
      }
      const profileData = await getUserProfile(user.uid);

      this.setState({
        isLoading: false,
        user: user,
        formValues: {
          lastName: profileData.lastName || "",
          firstName: profileData.firstName || "",
          age: profileData.age || "",
          gender: profileData.gender || "",
          email: profileData.email || "",
          type: profileData.type || "",
          allergies: profileData.allergies || "",
          photoURL: profileData.photoURL || null,
          mobileNumber: profileData.mobileNumber || "",
          address: profileData.address || "",
          postalCode: profileData.postalCode || "",
          state: profileData.state || "",
          country: profileData.country || "",
          status: profileData.status || "",
          medicalLicense: profileData.medicalLicense || "",
          education: profileData.education || "",
          department: profileData.department || "",
          designation: profileData.designation || "",
          about: profileData.about || "",
        },
      });
    } catch (error) {
      this.setState({ error: error.message, isLoading: false });
    }
  };

  handleInputChange = (e) => {
    const { name, value } = e.target;
    this.setState((prevState) => ({
      formValues: { ...prevState.formValues, [name]: value },
    }));
  };

  handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        this.setState((prevState) => ({
          formValues: { ...prevState.formValues, photoURL: reader.result },
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  handleSave = async () => {
    const { user, formValues } = this.state;
    
    if (!user) return;

    try {
      this.setState({ isLoading: true });

      // Upload de la nouvelle photo de profil
      let updatedPhotoURL = formValues.photoURL;
      if (this.inputPhoto && this.inputPhoto.files[0]) {
        updatedPhotoURL = await uploadProfilePicture(user.uid, this.inputPhoto.files[0]);
      }

      // Sauvegarde du profil mis à jour
      await saveUserProfile(user.uid, {
        lastName: formValues.lastName,
        firstName: formValues.firstName,
        age: formValues.age,
        gender: formValues.gender,
        email: formValues.email,
        type: formValues.type,
        allergies: formValues.allergies,
        photoURL: updatedPhotoURL,
        mobileNumber: formValues.mobileNumber,
        address: formValues.address,
        postalCode: formValues.postalCode,
        state: formValues.state,
        country: formValues.country,
        status: formValues.status,
        medicalLicense: formValues.medicalLicense,
        education: formValues.education,
        department: formValues.department,
        designation: formValues.designation,
        about: formValues.about,
      });

      alert("Profil mis à jour !");
      this.props.navigate("/EditProfile");
    } catch (error) {
      this.setState({ error: error.message });
    } finally {
      this.setState({ isLoading: false });
    }
  };

  render() {
    const { isLoading, error, formValues } = this.state;

    if (isLoading) return <p>Chargement...</p>;
    if (error) return <p>{error}</p>;

    return (
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-center">Modifier le profil</h2>

        {/* Photo de profil */}
        <div className="mb-4">
          <label htmlFor="photo" className="block text-sm font-medium text-gray-700">
            Photo de profil*
          </label>
          <input
            type="file"
            id="photo"
            accept="image/*"
            onChange={this.handlePhotoUpload}
            ref={(input) => (this.inputPhoto = input)}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          />
          {formValues.photoURL && (
            <img
              src={formValues.photoURL}
              alt={`${formValues.firstName} ${formValues.lastName}`}
              className="mt-2 w-24 h-24 object-cover rounded"
            />
          )}
        </div>

        {/* Informations personnelles */}
        <div className="space-y-4">
          {/* Prénom */}
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
              Prénom*
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formValues.firstName}
              onChange={this.handleInputChange}
              required
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Nom */}
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
              Nom*
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formValues.lastName}
              onChange={this.handleInputChange}
              required
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Âge */}
          <div>
            <label htmlFor="age" className="block text-sm font-medium text-gray-700">
              Âge
            </label>
            <input
              type="number"
              id="age"
              name="age"
              value={formValues.age || ""}
              onChange={this.handleInputChange}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Genre */}
          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
              Genre*
            </label>
            <select
              id="gender"
              name="gender"
              value={formValues.gender}
              onChange={this.handleInputChange}
              required
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            >
              <option value="Male">Masculin</option>
              <option value="Female">Féminin</option>
            </select>
          </div>

          {/* Champs spécifiques au rôle */}
          {formValues.type === "patient" && (
            <div>
              <label htmlFor="allergies" className="block text-sm font-medium text-gray-700">
                Allergies
              </label>
              <textarea
                id="allergies"
                name="allergies"
                value={formValues.allergies}
                onChange={this.handleInputChange}
                rows="3"
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          {formValues.type === "doctor" && (
            <>
              <div>
                <label htmlFor="medicalLicense" className="block text-sm font-medium text-gray-700">
                  Licence médicale
                </label>
                <input
                  type="text"
                  id="medicalLicense"
                  name="medicalLicense"
                  value={formValues.medicalLicense}
                  onChange={this.handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="education" className="block text-sm font-medium text-gray-700">
                  Éducation
                </label>
                <input
                  type="text"
                  id="education"
                  name="education"
                  value={formValues.education}
                  onChange={this.handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                  Département
                </label>
                <input
                  type="text"
                  id="department"
                  name="department"
                  value={formValues.department}
                  onChange={this.handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="designation" className="block text-sm font-medium text-gray-700">
                  Fonction
                </label>
                <input
                  type="text"
                  id="designation"
                  name="designation"
                  value={formValues.designation}
                  onChange={this.handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="about" className="block text-sm font-medium text-gray-700">
                  À propos
                </label>
                <textarea
                  id="about"
                  name="about"
                  value={formValues.about}
                  onChange={this.handleInputChange}
                  rows="3"
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
            </>
          )}

          {/* Bouton Sauvegarder */}
          <button
            type="submit"
            onClick={this.handleSave}
            className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 mt-6"
          >
            Sauvegarder
          </button>
        </div>
      </div>
    );
  }
}

EditProfile.propTypes = {
  navigate: PropTypes.func.isRequired,
};

