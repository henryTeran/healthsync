import { PRESCRIPTION_STATUS } from "./prescriptionStatus";

const VALIDATION_ELIGIBLE_STATUSES = [
  PRESCRIPTION_STATUS.SENT,
  PRESCRIPTION_STATUS.RECEIVED,
];

const VALIDATION_LOCKED_STATUSES = [
  PRESCRIPTION_STATUS.VALIDATED_BY_PATIENT,
  PRESCRIPTION_STATUS.ACTIVE,
  PRESCRIPTION_STATUS.COMPLETED,
];

const formatDate = (dateValue) => {
  if (!dateValue) return null;

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString("fr-FR");
};

export const isPrescriptionAlreadyValidated = (prescription) => {
  if (!prescription) return false;

  if (VALIDATION_LOCKED_STATUSES.includes(prescription.status)) {
    return true;
  }

  return Boolean(
    prescription?.validation?.validatedByPatient ||
      prescription?.validation?.validatedAt ||
      prescription?.validation?.patientStartDate
  );
};

export const canValidatePrescription = (prescription, patientId) => {
  if (!prescription) {
    return { allowed: false, reason: "Ordonnance introuvable." };
  }

  if (!patientId || prescription.patientId !== patientId) {
    return { allowed: false, reason: "Action non autorisée." };
  }

  if (isPrescriptionAlreadyValidated(prescription)) {
    return { allowed: false, reason: "Ordonnance déjà validée." };
  }

  if (!VALIDATION_ELIGIBLE_STATUSES.includes(prescription.status)) {
    return {
      allowed: false,
      reason: "Cette ordonnance ne peut pas être validée dans son état actuel.",
    };
  }

  return { allowed: true, reason: null };
};

export const getPrescriptionWorkflowState = (prescription, patientId) => {
  const validationState = canValidatePrescription(prescription, patientId);

  const validatedAt = prescription?.validation?.validatedAt;
  const patientStartDate = prescription?.validation?.patientStartDate;
  const isLocked = isPrescriptionAlreadyValidated(prescription);

  let message = null;
  if (isLocked) {
    if (validatedAt && patientStartDate) {
      message = `Ordonnance déjà validée le ${formatDate(validatedAt)}. Traitement déjà activé le ${formatDate(patientStartDate)}.`;
    } else if (validatedAt) {
      message = `Ordonnance déjà validée le ${formatDate(validatedAt)}.`;
    } else if (patientStartDate) {
      message = `Traitement déjà activé le ${formatDate(patientStartDate)}.`;
    } else {
      message = "Ordonnance déjà validée.";
    }
  }

  return {
    canValidate: validationState.allowed,
    validationBlockedReason: validationState.reason,
    isLocked,
    validatedAt,
    patientStartDate,
    message,
  };
};

export const isPrescriptionEditableByPatient = () => false;
