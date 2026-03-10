import {
  createPrescription,
  findByCreatorId,
  findById,
  findByPatientId,
  updateById,
} from "../infrastructure/prescriptionRepository.firebase";
import { listPrescriptionMedications } from "../../medications";

export const savePrescriptionUseCase = async (createdBy, patientId) => {
  const payload = {
    createdBy,
    patientId,
    creationDate: new Date().toISOString(),
    status: "send",
  };

  return createPrescription(payload);
};

export const getPrescriptionsByPatientUseCase = async (patientId) => {
  return findByPatientId(patientId);
};

export const updatePrescriptionStatusUseCase = async (idPrescription, newStatus) => {
  await updateById(idPrescription, { status: newStatus });
};

export const acceptPrescriptionUseCase = async (prescriptionId) => {
  await updateById(prescriptionId, { status: "validated" });
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
