// src/models/User.js
import { Timestamp } from "firebase/firestore";

export class User {
  constructor(data = {}) {
    //comun 
    this.id = data.id || null;
    this.firstName = data.firstName || "";
    this.lastName = data.lastName || "";
    this.age = data.age || null;
    this.dateOfBirth = data.dateOfBirth || "";
    this.gender = data.gender || "male";
    this.email = data.email || "";
    this.mobileNumber = data.mobileNumber || ""; // Nouveau champ
    this.address = data.address || ""; // Nouveau champ
    this.postalCode = data.postalCode || ""; // Nouveau champ
    this.state = data.state || ""; // Nouveau champ
    this.country = data.country || "Suisse"; // Nouveau champ
    this.status = data.status || "Active";
    this.type = data.type || "patient"; // 'patient' ou 'doctor'
    this.photoURL = data.photoURL || "";
    this.password = data.password || "";
    
    //patient 
    this.allergies = data.allergies || "";
    
    
    // Medecin 
    this.education = data.education || ""; // Nouveau champ
    this.medicalLicense = data.medicalLicense || null; // Spécifique aux médecins
    this.department = data.department || ""; // Nouveau champ
    this.designation = data.designation || ""; // Nouveau champ
    this.about = data.about || "";
    this.fcmToken = data.fcmToken || "";
  }

    // Validation du mot de passe
  validatePassword(confirmPassword) {
    return this.password === confirmPassword;
  }
    // Vérification si l'utilisateur est un médecin
  isDoctor() {
    return this.role === "doctor";
  }

  toFirestore() {
    return {
      // Champs communs
      firstName: this.firstName || "", // Prénom
      lastName: this.lastName || "", // Nom
      age: this.age || null, // Âge (optionnel)
      dateOfBirth: this.dateOfBirth ? Timestamp.fromDate(new Date(this.dateOfBirth)) : null, // Converti en Timestamp
      gender: this.gender || "male", // Genre par défaut "male"
      email: this.email || "", // Adresse e-mail
      mobileNumber: this.mobileNumber || "", // Numéro de téléphone
      address: this.address || "", // Adresse
      postalCode: this.postalCode || "", // Code postal
      state: this.state || "", // Région
      country: this.country || "Suisse", // Pays (par défaut "Suisse")
      status: this.status || "Active", // Statut (par défaut "Active")
      type: this.type || "patient", // Type d'utilisateur ("patient" ou "doctor")
      photoURL: this.photoURL || "", // URL de la photo de profil
      
      // Champs spécifiques au patient
      allergies: this.allergies || "", // Allergies du patient
      
      // Champs spécifiques au médecin
      education: this.education || "", // Niveau d'éducation
      medicalLicense: this.medicalLicense || null, // Licence médicale (spécifique aux médecins)
      department: this.department || "", // Département (spécifique aux médecins)
      designation: this.designation || "", // Poste (spécifique aux médecins)
      about: this.about || "", // À propos (spécifique aux médecins)
      fcmToken : this.fcmToken || "",

    };
  }

  // Méthode pour convertir l'utilisateur en objet JSON
  toJSON() {
    return {
      // Champs communs
      id: this.id || null, // Identifiant unique (peut être null si non défini)
      firstName: this.firstName || "", // Prénom
      lastName: this.lastName || "", // Nom
      age: this.age || null, // Âge (optionnel)
      dateOfBirth: this.dateOfBirth || "", // Date de naissance
      gender: this.gender || "male", // Genre par défaut "male"
      email: this.email || "", // Adresse e-mail
      mobileNumber: this.mobileNumber || "", // Numéro de téléphone
      address: this.address || "", // Adresse
      postalCode: this.postalCode || "", // Code postal
      state: this.state || "", // Région
      country: this.country || "Suisse", // Pays (par défaut "Suisse")
      status: this.status || "Active", // Statut (par défaut "Active")
      type: this.type || "patient", // Type d'utilisateur ("patient" ou "doctor")
      photoURL: this.photoURL || "", // URL de la photo de profil
      
      // Champs spécifiques au patient
      allergies: this.allergies || "", // Allergies du patient
      
      // Champs spécifiques au médecin
      education: this.education || "", // Niveau d'éducation
      medicalLicense: this.medicalLicense || null, // Licence médicale (spécifique aux médecins)
      department: this.department || "", // Département (spécifique aux médecins)
      designation: this.designation || "", // Poste (spécifique aux médecins)
      about: this.about || "", // À propos (spécifique aux médecins)
      fcmToken : this.fcmToken || "",

    };
  }
}

