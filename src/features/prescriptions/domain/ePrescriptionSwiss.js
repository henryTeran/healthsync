const formatDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().split("T")[0];
};

export const SWISS_EPRESCRIPTION_ISSUE_TYPES = {
  SINGLE: "single",
  RENEWABLE: "renewable",
  CHRONIC: "chronic",
};

export const buildSwissEPrescriptionPayload = ({
  formValues,
  doctorProfile,
  patient,
  prescriptionId,
  medications = [],
}) => {
  const issuedAt = formatDate(formValues?.issuedAt) || new Date().toISOString().split("T")[0];
  const validUntil =
    formatDate(formValues?.validUntil) ||
    new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split("T")[0];

  const reference =
    formValues?.reference ||
    `CH-ERX-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  const payload = {
    standard: "CH-ERX",
    chmedVersion: "CHMED16A_R2",
    language: "fr-CH",
    reference,
    issuedAt,
    validUntil,
    placeOfIssue: formValues?.placeOfIssue || doctorProfile?.state || doctorProfile?.country || "Suisse",
    issueType: formValues?.issueType || SWISS_EPRESCRIPTION_ISSUE_TYPES.SINGLE,
    repeatsAllowed: Number(formValues?.repeatsAllowed || 0),
    substitutionAllowed: Boolean(formValues?.substitutionAllowed),
    emergencyPrescription: Boolean(formValues?.emergencyPrescription),
    narcoticsExcludedDeclaration: Boolean(formValues?.narcoticsExcludedDeclaration),
    signedRegisteredToken: formValues?.signedRegisteredToken || null,
    therapeuticPurpose: formValues?.therapeuticPurpose || "Non renseigné",
    legalNotes:
      formValues?.legalNotes ||
      "Ordonnance électronique émise par un professionnel de santé. Toute adaptation thérapeutique requiert validation médicale.",
    patientAdministrative: {
      patientId: patient?.id || null,
      avsNumber: formValues?.avsNumber || patient?.avsNumber || null,
      insuranceName: formValues?.insuranceName || patient?.insuranceName || null,
      insuranceNumber: formValues?.insuranceNumber || patient?.insuranceNumber || null,
    },
    prescriber: {
      id: doctorProfile?.id || null,
      firstName: doctorProfile?.firstName || null,
      lastName: doctorProfile?.lastName || null,
      specialty: doctorProfile?.specialty || doctorProfile?.department || null,
      gln: formValues?.prescriberGLN || doctorProfile?.gln || null,
      zsr: formValues?.prescriberZSR || doctorProfile?.zsr || null,
      rcc: formValues?.prescriberRCC || doctorProfile?.rcc || null,
      professionalId:
        formValues?.prescriberProfessionalId ||
        doctorProfile?.professionalId ||
        doctorProfile?.medicalLicense ||
        null,
    },
    qrPayload: JSON.stringify({
      reference,
      issuedAt,
      validUntil,
      patientId: patient?.id || null,
      prescriberId: doctorProfile?.id || null,
      prescriptionId: prescriptionId || null,
      token: formValues?.signedRegisteredToken || null,
    }),
    medicationsSnapshot: medications.map((medication) => ({
      id: medication?.id || null,
      name: medication?.name || null,
      dosage: medication?.dosage || null,
      frequency: medication?.frequency || null,
      duration: medication?.duration || null,
      controlledSubstance: Boolean(medication?.controlledSubstance || medication?.isNarcotic),
    })),
  };

  return payload;
};

export const validateSwissEPrescriptionPayload = (payload) => {
  const errors = [];

  if (!payload?.issuedAt) {
    errors.push("La date d'émission est obligatoire.");
  }

  if (!payload?.validUntil) {
    errors.push("La date de validité est obligatoire.");
  }

  if (!payload?.placeOfIssue) {
    errors.push("Le lieu d'émission est obligatoire.");
  }

  if (!payload?.therapeuticPurpose) {
    errors.push("L'indication thérapeutique est obligatoire.");
  }

  if (!payload?.narcoticsExcludedDeclaration) {
    errors.push("La déclaration d'exclusion des stupéfiants est obligatoire pour E-Rezept Suisse.");
  }

  if (!payload?.signedRegisteredToken) {
    errors.push("Le jeton du dataset signé/enregistré est obligatoire (exigence QR E-Rezept Suisse).");
  }

  const containsNarcotic = (payload?.medicationsSnapshot || []).some(
    (medication) => medication?.controlledSubstance
  );

  if (containsNarcotic) {
    errors.push("Les stupéfiants ne doivent pas être prescrits via le service E-Rezept Suisse.");
  }

  if (!payload?.prescriber?.gln && !payload?.prescriber?.rcc && !payload?.prescriber?.professionalId) {
    errors.push("Au moins un identifiant prescripteur (GLN, RCC ou identifiant pro) est requis.");
  }

  return errors;
};
