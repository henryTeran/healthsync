import { describe, it, expect } from "@jest/globals";
import { validateProfileForm } from "../../../features/profile/ui/profileFormValidation";

describe("validateProfileForm", () => {
  it("retourne des erreurs pour les champs requis manquants", () => {
    const result = validateProfileForm({
      firstName: "",
      lastName: "",
      email: "",
      gender: "",
      userType: "patient",
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.firstName).toBeDefined();
    expect(result.errors.lastName).toBeDefined();
    expect(result.errors.email).toBeDefined();
    expect(result.errors.gender).toBeDefined();
  });

  it("valide correctement un profil médecin complet", () => {
    const result = validateProfileForm({
      firstName: "Marie",
      lastName: "Dupont",
      email: "marie.dupont@test.com",
      gender: "female",
      age: 32,
      mobileNumber: "+33 6 12 34 56 78",
      userType: "doctor",
      medicalLicense: "MED-2026-ABC",
    });

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it("impose la licence médicale pour un médecin", () => {
    const result = validateProfileForm({
      firstName: "Paul",
      lastName: "Martin",
      email: "paul.martin@test.com",
      gender: "male",
      userType: "doctor",
      medicalLicense: "",
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.medicalLicense).toBeDefined();
  });
});
