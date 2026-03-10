import {
  addUserMedication,
  createMedication,
  findByPrescriptionAndName,
  findByPrescriptionId,
  findUserTrackedMedication,
  removeById,
  updateById,
} from "../infrastructure/medicationRepository.firebase";
import {
  calculateEndDate,
  extractDuration,
  extractFrequency,
  generateTimes,
} from "../domain/medicationSchedule";

export const addMedicationToPrescription = async ({
  idPrescription,
  medication,
  patientId,
  doctorId,
}) => {
  const medicationData = {
    idPrescription,
    patientId,
    createdBy: doctorId,
    ...medication,
  };

  return createMedication(medicationData);
};

export const listPrescriptionMedications = async (idPrescription) => {
  return findByPrescriptionId(idPrescription);
};

export const deleteMedicationById = async (idMedication) => {
  await removeById(idMedication);
};

export const updateMedicationById = async (medicationId, updatedData) => {
  await updateById(medicationId, updatedData);
};

export const trackMedicationForUser = async ({
  medication,
  startDate,
  durationText,
  idPrescription,
}) => {
  if (!medication || !startDate || !durationText) {
    throw new Error("Veuillez remplir tous les champs.");
  }

  const existingMedications = await findUserTrackedMedication(
    medication.id,
    medication.name
  );

  if (!existingMedications.empty) {
    return { alreadyTracked: true, times: [] };
  }

  const durationInDays = extractDuration(durationText);
  if (!durationInDays) {
    throw new Error("Durée invalide.");
  }

  const frequencyPerDay = extractFrequency(medication.frequency);
  if (!frequencyPerDay) {
    throw new Error("Fréquence invalide.");
  }

  const endDate = calculateEndDate(startDate, durationText);
  const times = generateTimes(medication.frequency);

  await addUserMedication({
    idMedication: medication.id,
    name: medication.name,
    dosage: medication.dosage,
    frequency: medication.frequency,
    duration: durationInDays,
    startDate,
    endDate,
    times,
    status: "active",
  });

  const linkedMedications = await findByPrescriptionAndName(
    idPrescription,
    medication.name
  );

  const updates = linkedMedications.docs.map((snapshot) =>
    updateById(snapshot.id, {
      startDate,
      endDate,
    })
  );

  await Promise.all(updates);

  return { alreadyTracked: false, times };
};
