import { useContext, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const inputPhotoRef = useRef(null);
  const { register } = useContext(AuthContext);

  const handleRegister = async (event) => {
    event.preventDefault();

    try {
      const updatedFormData = {
        ...formData,
        role: formData.role.toLowerCase(),
        type: formData.role.toLowerCase(),
      };

      const validate = RegistrationService.register(updatedFormData, updatedFormData.confirmPassword);
      if (!validate.success) {
        setError(validate.errors.join("\n"));
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

      alert("Inscription reussie !");
      navigate("/login");
    } catch (registrationError) {
      console.error("Erreur d'inscription :", registrationError);
      setError(registrationError.message);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-200 to-white">
      <form className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full p-8 rounded-lg shadow-lg" onSubmit={handleRegister}>
        <ConnectionSection error={error} formData={formData} onChange={handleChange} />
        <PersonalSection formData={formData} onChange={handleChange} />
        <AdditionalSection
          formData={formData}
          inputPhotoRef={inputPhotoRef}
          onChange={handleChange}
          onPhotoUpload={handlePhotoUpload}
        />

        <div className="col-span-3 flex justify-center mt-8">
          <button type="submit" className="w-64 bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
            S'inscrire
          </button>
        </div>
      </form>
    </div>
  );
}