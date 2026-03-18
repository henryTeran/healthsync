import {
  createPrescription,
  findByCreatorId,
  findById,
  findByPatientId,
  findReceivedByPatientId,
  updateById,
} from "../infrastructure/prescriptionRepository.firebase";
import { listPrescriptionMedications } from "../../medications";
import { trackMedicationForUser } from "../../medications";
import { scheduleMedicationReminders } from "../../reminders";
import {
  canTransitionPrescriptionStatus,
  PRESCRIPTION_STATUS,
} from "../domain/prescriptionStatus";

export const savePrescriptionUseCase = async (createdBy, patientId) => {
  const payload = {
    createdBy,
    patientId,
    creationDate: new Date().toISOString(),
    status: PRESCRIPTION_STATUS.CREATED,
  };

  return createPrescription(payload);
};

export const getPrescriptionsByPatientUseCase = async (patientId) => {
  return findByPatientId(patientId);
};

export const updatePrescriptionStatusUseCase = async (idPrescription, newStatus) => {
  const current = await findById(idPrescription);
  if (!current) {
    throw new Error("Prescription introuvable.");
  }

  if (!canTransitionPrescriptionStatus(current.status, newStatus)) {
    throw new Error(
      `Transition de statut invalide (${current.status || "unknown"} -> ${newStatus}).`
    );
  }

  await updateById(idPrescription, {
    status: newStatus,
    statusUpdatedAt: new Date().toISOString(),
  });
};

export const acceptPrescriptionUseCase = async (prescriptionId) => {
  await updatePrescriptionStatusUseCase(
    prescriptionId,
    PRESCRIPTION_STATUS.VALIDATED_BY_PATIENT
  );
};

export const getPrescriptionByIdUseCase = async (idPrescription) => {
  const prescription = await findById(idPrescription);
  if (!prescription) return null;

  const medications = await listPrescriptionMedications(idPrescription);
  return { ...prescription, medications };
};

export const setMedicationStartDateUseCase = async (prescriptionId, startDate) => {
  await updateById(prescriptionId, { startDate });
};

export const updatePrescriptionUseCase = async (prescriptionId, updatedData) => {
  await updateById(prescriptionId, updatedData);
};

export const getPrescriptionsByUserUseCase = async (userId) => {
  return findByCreatorId(userId);
};

export const getReceivedPrescriptionsByPatientUseCase = async (patientId) => {
  return findReceivedByPatientId(patientId);
};

export const markPrescriptionAsReceivedUseCase = async (prescriptionId, patientId) => {
  const prescription = await findById(prescriptionId);
  if (!prescription) {
    throw new Error("Prescription introuvable.");
  }

  if (prescription.patientId !== patientId) {
    throw new Error("Action non autorisée.");
  }

  if (prescription.status === PRESCRIPTION_STATUS.RECEIVED) {
    return;
  }

  if (!canTransitionPrescriptionStatus(prescription.status, PRESCRIPTION_STATUS.RECEIVED)) {
    return;
  }

  await updateById(prescriptionId, {
    status: PRESCRIPTION_STATUS.RECEIVED,
    receivedAt: new Date().toISOString(),
    statusUpdatedAt: new Date().toISOString(),
  });
};

export const validatePrescriptionAndActivateTreatmentsUseCase = async ({
  prescriptionId,
  patientId,
  startDate,
}) => {
  if (!prescriptionId || !patientId || !startDate) {
    throw new Error("Champs de validation incomplets.");
  }

  const prescription = await findById(prescriptionId);
  if (!prescription) {
    throw new Error("Prescription introuvable.");
  }

  if (prescription.patientId !== patientId) {
    throw new Error("Action non autorisée.");
  }

  if (
    ![
      PRESCRIPTION_STATUS.RECEIVED,
      PRESCRIPTION_STATUS.SENT,
      PRESCRIPTION_STATUS.VALIDATED_BY_PATIENT,
      PRESCRIPTION_STATUS.ACTIVE,
    ].includes(prescription.status)
  ) {
    throw new Error("Cette ordonnance ne peut pas être validée actuellement.");
  }

  const medications = await listPrescriptionMedications(prescriptionId);
  let createdCount = 0;

  for (const medication of medications) {
    const tracked = await trackMedicationForUser({
      medication,
      startDate,
      durationText: medication.duration,
      idPrescription: prescriptionId,
      userId: patientId,
    });

    if (!tracked.alreadyTracked) {
      createdCount += 1;
      await scheduleMedicationReminders(patientId, {
        id: medication.id,
        name: medication.name,
        frequency: medication.frequency,
        startDate,
      });
    }
  }

  await updateById(prescriptionId, {
    status: PRESCRIPTION_STATUS.ACTIVE,
    validation: {
      validatedByPatient: true,
      validatedAt: new Date().toISOString(),
      patientStartDate: startDate,
    },
    statusUpdatedAt: new Date().toISOString(),
  });

  return {
    activatedTreatments: createdCount,
    medicationsCount: medications.length,
  };
};
