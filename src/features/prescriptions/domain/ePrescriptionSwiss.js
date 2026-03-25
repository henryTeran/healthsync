const formatDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().split("T")[0];
};

const digitsOnly = (value) => String(value || "").replace(/\D/g, "");

const isSwissAvsValid = (avs) => {
  const normalized = String(avs || "").trim();
  if (!normalized) return false;

  const withDotsPattern = /^756\.\d{4}\.\d{4}\.\d{2}$/;
  if (withDotsPattern.test(normalized)) return true;

  const compact = digitsOnly(normalized);
  return /^756\d{10}$/.test(compact);
};

const isGlnValid = (gln) => /^\d{13}$/.test(digitsOnly(gln));

const normalizeIssueType = (issueType) => {
  if (Object.values(SWISS_EPRESCRIPTION_ISSUE_TYPES).includes(issueType)) {
    return issueType;
  }
  return SWISS_EPRESCRIPTION_ISSUE_TYPES.SINGLE;
};

const buildDeterministicChecksum = (value) => {
  const source = String(value || "");
  let hash = 0;

  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 31 + source.charCodeAt(index)) >>> 0;
  }

  return hash.toString(16).toUpperCase().padStart(8, "0");
};

export const generateSwissERxToken = ({ userId, reference }) => {
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const userPart = String(userId || "ANON").slice(0, 6).toUpperCase();
  const refPart = String(reference || "REF").replace(/[^A-Z0-9]/gi, "").slice(-6).toUpperCase();
  return `ERX-CH-${timestamp}-${userPart}-${refPart}`;
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
  const issueType = normalizeIssueType(formValues?.issueType);
  const issuedAt = formatDate(formValues?.issuedAt) || new Date().toISOString().split("T")[0];
  const validUntil =
    formatDate(formValues?.validUntil) ||
    new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split("T")[0];

  const reference =
    formValues?.reference ||
    `CH-ERX-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  const repeatsAllowed = Number(formValues?.repeatsAllowed || 0);

  const medicationsSnapshot = medications.map((medication) => ({
    id: medication?.id || null,
    name: medication?.name || null,
    dosage: medication?.dosage || null,
    pharmaceuticalForm: medication?.pharmaceuticalForm || medication?.form || null,
    posology: medication?.posology || medication?.instruction || null,
    frequency: medication?.frequency || null,
    duration: medication?.duration || null,
    quantity: medication?.quantity || null,
    controlledSubstance: Boolean(medication?.controlledSubstance || medication?.isNarcotic),
  }));

  const datasetToSign = {
    standard: "CH-ERX",
    chmedVersion: "CHMED16A_R2",
    reference,
    issuedAt,
    validUntil,
    issueType,
    repeatsAllowed,
    patientId: patient?.id || null,
    prescriberId: doctorProfile?.id || null,
    medicationsSnapshot,
  };

  const datasetChecksum = buildDeterministicChecksum(JSON.stringify(datasetToSign));

  const payload = {
    standard: "CH-ERX",
    chmedVersion: "CHMED16A_R2",
    language: "fr-CH",
    reference,
    datasetChecksum,
    issuedAt,
    validUntil,
    placeOfIssue: formValues?.placeOfIssue || doctorProfile?.state || doctorProfile?.country || "Suisse",
    issueType,
    repeatsAllowed,
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
      firstName: patient?.firstName || null,
      lastName: patient?.lastName || null,
      dateOfBirth: patient?.birthDate || patient?.dateOfBirth || null,
      avsNumber: formValues?.avsNumber || patient?.avsNumber || null,
      insuranceName: formValues?.insuranceName || patient?.insuranceName || null,
      insuranceNumber: formValues?.insuranceNumber || patient?.insuranceNumber || null,
      medicalRecordNumber: formValues?.medicalRecordNumber || patient?.recordNumber || null,
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
      datasetChecksum,
      issuedAt,
      validUntil,
      patientId: patient?.id || null,
      prescriberId: doctorProfile?.id || null,
      prescriptionId: prescriptionId || null,
      token: formValues?.signedRegisteredToken || null,
    }),
    medicationsSnapshot,
  };

  return payload;
};

export const validateSwissEPrescriptionPayload = (payload, options = {}) => {
  const requireSignedToken = options?.requireSignedToken !== false;
  const errors = [];

  const issuedAtDate = payload?.issuedAt ? new Date(payload.issuedAt) : null;
  const validUntilDate = payload?.validUntil ? new Date(payload.validUntil) : null;

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

  if (String(payload?.therapeuticPurpose || "").trim().length < 5) {
    errors.push("L'indication thérapeutique doit contenir au moins 5 caractères.");
  }

  if (
    issuedAtDate instanceof Date &&
    !Number.isNaN(issuedAtDate?.getTime?.()) &&
    validUntilDate instanceof Date &&
    !Number.isNaN(validUntilDate?.getTime?.()) &&
    validUntilDate < issuedAtDate
  ) {
    errors.push("La date de validité doit être postérieure à la date d'émission.");
  }

  if (!payload?.issueType || !Object.values(SWISS_EPRESCRIPTION_ISSUE_TYPES).includes(payload.issueType)) {
    errors.push("Le type d'ordonnance est invalide.");
  }

  if (payload?.issueType === SWISS_EPRESCRIPTION_ISSUE_TYPES.SINGLE && Number(payload?.repeatsAllowed || 0) !== 0) {
    errors.push("Une ordonnance de type unique ne peut pas avoir de répétition.");
  }

  if (
    [SWISS_EPRESCRIPTION_ISSUE_TYPES.RENEWABLE, SWISS_EPRESCRIPTION_ISSUE_TYPES.CHRONIC].includes(payload?.issueType) &&
    Number(payload?.repeatsAllowed || 0) < 1
  ) {
    errors.push("Une ordonnance renouvelable/chronique doit autoriser au moins 1 répétition.");
  }

  if (Number(payload?.repeatsAllowed || 0) > 12) {
    errors.push("Le nombre de répétitions autorisées est limité à 12.");
  }

  if (!payload?.narcoticsExcludedDeclaration) {
    errors.push("La déclaration d'exclusion des stupéfiants est obligatoire pour E-Rezept Suisse.");
  }

  if (requireSignedToken) {
    if (!payload?.signedRegisteredToken) {
      errors.push("Le jeton du dataset signé/enregistré est obligatoire (exigence QR E-Rezept Suisse).");
    }

    if (String(payload?.signedRegisteredToken || "").trim().length < 12) {
      errors.push("Le jeton e-Rezept semble invalide (longueur minimale 12).");
    }
  }

  if (!payload?.datasetChecksum) {
    errors.push("Le checksum du dataset e-Rezept est manquant.");
  }

  if (!payload?.patientAdministrative?.patientId) {
    errors.push("L'identifiant patient est obligatoire.");
  }

  if (!isSwissAvsValid(payload?.patientAdministrative?.avsNumber)) {
    errors.push("Le numéro AVS patient est invalide (format attendu: 756.XXXX.XXXX.XX).");
  }

  if (!payload?.patientAdministrative?.insuranceName) {
    errors.push("Le nom de l'assureur est obligatoire.");
  }

  if (!payload?.patientAdministrative?.medicalRecordNumber) {
    errors.push("Le numéro de dossier médical est obligatoire.");
  }

  const containsNarcotic = (payload?.medicationsSnapshot || []).some(
    (medication) => medication?.controlledSubstance
  );

  if (containsNarcotic) {
    errors.push("Les stupéfiants ne doivent pas être prescrits via le service E-Rezept Suisse.");
  }

  if (!payload?.medicationsSnapshot?.length) {
    errors.push("Au moins un médicament est requis pour générer une e-ordonnance.");
  }

  const medicationWithMissingData = (payload?.medicationsSnapshot || []).find(
    (medication) =>
      !medication?.name || !medication?.dosage || !medication?.frequency || !medication?.duration
  );

  if (medicationWithMissingData) {
    errors.push("Chaque médicament doit inclure nom, dosage, fréquence et durée.");
  }

  if (payload?.prescriber?.gln && !isGlnValid(payload.prescriber.gln)) {
    errors.push("Le GLN prescripteur est invalide (13 chiffres attendus).");
  }

  if (!payload?.prescriber?.gln && !payload?.prescriber?.rcc && !payload?.prescriber?.professionalId) {
    errors.push("Au moins un identifiant prescripteur (GLN, RCC ou identifiant pro) est requis.");
  }

  return errors;
};
