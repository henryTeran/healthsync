export const validateProfileForm = (formValues = {}) => {
  const errors = {};

  const firstName = String(formValues.firstName || "").trim();
  const lastName = String(formValues.lastName || "").trim();
  const email = String(formValues.email || "").trim();
  const gender = String(formValues.gender || "").trim();
  const mobileNumber = String(formValues.mobileNumber || "").trim();
  const userType = String(formValues.userType || formValues.type || "patient").toLowerCase();
  const medicalLicense = String(formValues.medicalLicense || "").trim();

  if (!firstName) {
    errors.firstName = "Le prénom est requis.";
  }

  if (!lastName) {
    errors.lastName = "Le nom est requis.";
  }

  if (!email) {
    errors.email = "L'email est requis.";
  } else if (!/^\S+@\S+\.\S+$/.test(email)) {
    errors.email = "Format d'email invalide.";
  }

  if (!gender) {
    errors.gender = "Le genre est requis.";
  }

  if (formValues.age !== "" && formValues.age !== null && formValues.age !== undefined) {
    const age = Number(formValues.age);
    if (Number.isNaN(age) || age < 0) {
      errors.age = "L'âge doit être un nombre positif.";
    }
  }

  if (mobileNumber && !/^[+\d\s()-]{8,20}$/.test(mobileNumber)) {
    errors.mobileNumber = "Format de téléphone invalide.";
  }

  if (userType === "doctor" && !medicalLicense) {
    errors.medicalLicense = "La licence médicale est requise pour un médecin.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
