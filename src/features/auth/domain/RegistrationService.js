import { User } from '../../../models/User';

export class RegistrationService {
  static register(data, confirmPassword) {
    const errors = [];

    if (!this.isValidEmail(data.email)) {
      errors.push("L'adresse e-mail n'est pas valide.");
    }

    const user = new User(data);
    if (!user.validatePassword(confirmPassword)) {
      errors.push('Les mots de passe ne correspondent pas.');
    }

    if (data.role !== 'patient' && data.role !== 'doctor') {
      errors.push("Le rôle doit être 'Patient' ou 'Médecin'.");
    }

    if (user.isDoctor() && !data.medicalLicense) {
      errors.push('Un médecin doit fournir un numéro de licence médicale.');
    }

    if (!data.firstName) errors.push('Le prénom est requis.');
    if (!data.lastName) errors.push('Le nom est requis.');
    if (!data.mobileNumber) errors.push('Le numéro de téléphone est requis.');
    if (!data.state) errors.push('La région est requise.');
    if (!data.country) errors.push('Le pays est requis.');
    if (!data.postalCode) errors.push('Le code postal est requis.');
    if (!data.dateOfBirth) errors.push('La date de naissance est requise.');
    if (!data.gender) errors.push('Le genre est requis.');

    if (errors.length === 0) {
      return { success: true, data: user.toJSON() };
    }

    return { success: false, errors };
  }

  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
