import { useRef, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { RegistrationService } from "../../../features/auth";
import { saveUserProfile, uploadProfilePicture } from "../../../features/profile";
import { AuthContext } from "../../../contexts/AuthContext";

export function Register() {

  const [formData, setFormData] = useState({
    role: "Patient", // Par défaut, un utilisateur est un patient
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    age: null,
    dateOfBirth: "",
    gender: "Male",
    mobileNumber: "",
    address: "",
    postalCode: "",
    state: "",
    country: "Suisse",
    status: "Active",
    type: "patient", // 'patient' ou 'doctor'
    photoURL: "", // URL de la photo de profil
    allergies: "", // Spécifique aux patients
    medicalLicense: "", // Spécifique aux médecins
    education: "", // Spécifique aux médecins
    department: "", // Spécifique aux médecins
    designation: "", // Spécifique aux médecins
    about: "", // Spécifique aux médecins
  });

  const [error, setError] = useState("");
  const navigate = useNavigate();
  const inputPhotoRef = useRef(null);
   const { register } = useContext(AuthContext);


   const handleRegister = async (e) => {
    e.preventDefault();
  
    try {
      console.log("🔄 Tentative d'inscription...");
  
      // 🔥 Corrige le problème du rôle qui peut être mal formaté
      const updatedFormData = {
        ...formData,
        role: formData.role.toLowerCase() 
      };
  
      // 🔍 Validation
      const validate = RegistrationService.register(updatedFormData, updatedFormData.confirmPassword);
      
      if (!validate.success) {
        setError(validate.errors.join("\n"));
        return;
      }
  
      // 🚀 Étape 1 : Inscription Firebase
      const userCredentialID = await register(updatedFormData.email, updatedFormData.password);
  
      // 📸 Étape 2 : Upload de la photo
      let updatedPhotoURL = updatedFormData.photoURL;
      if (inputPhotoRef.current && inputPhotoRef.current.files[0]) {
        updatedPhotoURL = await uploadProfilePicture(userCredentialID, inputPhotoRef.current.files[0]);
      }
  
      // 📝 Étape 3 : Création du profil Firestore
      const profileData = {
        ...updatedFormData,
        id: userCredentialID,
        photoURL: updatedPhotoURL,
      };
  
      await saveUserProfile(userCredentialID, profileData);
  
      console.log("✅ Inscription réussie !");
      alert("Inscription réussie !");
      navigate("/login");
  
    } catch (err) {
      console.error("❌ Erreur d'inscription :", err);
      setError(err.message);
    }
  };
  

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prevData) => ({
          ...prevData,
          photoURL: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };


 
     
  
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-200 to-white">
        {/* Conteneur principal */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full p-8  rounded-lg shadow-lg">
          {/* Bloc 1 : Informations de connexion */}
          <div className="mb-8">
            <h3 className="text-lg font-semibolt mb-4">Informations de connexion</h3>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <form className="space-y-4" onSubmit={handleRegister}>
              {/* Email */}
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
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
  
              {/* Mot de passe */}
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
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
  
              {/* Confirmation du mot de passe */}
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
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
            </form>
          </div>
  
          {/* Bloc 2 : Informations personnelles */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Informations personnelles</h3>
            {/* Rôle */}
            <div className="mb-4">
              <label htmlFor="role" className="sr-only">
                Rôle*
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              >
                <option value="patient">Patient</option>
                <option value="doctor">Médecin</option>
              </select>
            </div>
            {/* Genre */}
            <div className="mb-4">
              <label htmlFor="gender" className="sr-only">
                Genre*
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              >
                <option value="Masculin">Masculin</option>
                <option value="Féminin">Féminin</option>
              </select>
            </div>
  
            {/* Prénom */}
            <div className="mb-4">
              <label htmlFor="firstName" className="sr-only">
                Prénom*
              </label>
              <input
                type="text"
                id="firstName"
                placeholder="Prénom*"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              />
            </div>
  
            {/* Nom */}
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
                onChange={handleChange}
                required
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              />
            </div>
  
            {/* Âge */}
            <div className="mb-4">
              <label htmlFor="age" className="sr-only">
                Âge
              </label>
              <input
                type="number"
                id="age"
                placeholder="Age"
                name="age"
                value={formData.age || ""}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              />
            </div>
  
            {/* Date de naissance */}
            <div className="mb-4">
              <label htmlFor="dateOfBirth" className="sr-only">
                Date de naissance
              </label>
              <input
                type="date"
                id="dateOfBirth"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              />
            </div>
  
          </div>
  
          {/* Bloc 3 : Informations supplémentaires */}
          <div className="mb-8">
          <div className="text-lg font-semibold mb-11"></div>
            {/* Numéro de téléphone */}
            <div className="mb-4">
              <label htmlFor="mobileNumber" className="sr-only">
                Numéro de téléphone
              </label>
              <input
                type="text"
                placeholder="Numéro de téléphone"
                id="mobileNumber"
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              />
            </div>
  
            {/* Adresse */}
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
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              />
            </div>
  
            {/* Code postal */}
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
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              />
            </div>
  
            {/* Ville */}
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
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              />
            </div>
  
            {/* Pays */}
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
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              />
            </div>
  
            {/* Statut */}
            <div className="mb-4">
              <label htmlFor="status" className="sr-only">
                Statut*
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              >
                <option value="Actif">Actif</option>
                <option value="Non actif">Non actif</option>
              </select>
            </div>
  
            {/* Photo de profil */}
            <div className="mb-4">
              <label htmlFor="photoURL" className="sr-only">
                Photo de profil*
              </label>
              <input
                type="file"
                id="photoURL"
                ref={inputPhotoRef}
                // accept="image/*"
                onChange={handlePhotoUpload}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              />
            </div>
  
            {/* Champs spécifiques au rôle */}
            {formData.role === "patient" && (
              <>
               <div className="mb-4"> 
                <label htmlFor="allergies" className="sr-only">
                  Allergies
                </label>
                <textarea
                  id="allergies"
                  placeholder="Allergies"
                  
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleChange}
                  rows="3"
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>
              </>
            )}
  
            {formData.role === "doctor" && (
              <>
               <div className="mb-4"> 
                  <label htmlFor="medicalLicense" className="sr-only">
                    Licence médicale
                  </label>
                  <input
                    type="text"
                    placeholder="Licence médicale"
                    id="medicalLicense"
                    name="medicalLicense"
                    value={formData.medicalLicense}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="mb-4"> 
                  <label htmlFor="education" className="sr-only">
                    Éducation
                  </label>
                  <input
                    type="text"
                    id="education"
                    placeholder="Éducation"
                    name="education"
                    value={formData.education}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="mb-4"> 
                  <label htmlFor="department" className="sr-only">
                    Département
                  </label>
                  <input
                    type="text"
                    id="department"
                    placeholder="Département"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
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
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="mb-4"> 
                  <label htmlFor="about" className="sr-only">
                    À propos
                  </label>
                  <textarea
                    id="about"
                    placeholder="À propos"
                    name="about"
                    value={formData.about}
                    onChange={handleChange}
                    rows="3"
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>
              </>
            )}
          </div>
  
          {/* Bouton d'inscription */}
          <div className="col-span-3 flex justify-center mt-8">
            <button
              type="submit"
              onClick={handleRegister}
              className="w-64 bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            >
              S'inscrire
            </button>
          </div>
        </div>
      </div>
    );
}