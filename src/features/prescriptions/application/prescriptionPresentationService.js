export const mapPrescriptionToPdfPreview = ({
  prescription,
  patient,
  doctor,
}) => {
  const safePrescription = prescription || {};

  return {
    id: safePrescription.id,
    patientId: safePrescription.patientId || patient?.id,
    creationDate: safePrescription.creationDate,
    status: safePrescription.status,
    validation: safePrescription.validation || null,
    ePrescription: safePrescription.ePrescription || null,
    metadata: {
      place:
        safePrescription?.metadata?.place ||
        safePrescription?.ePrescription?.placeOfIssue ||
        doctor?.state ||
        doctor?.country,
      medicalRecordNumber:
        safePrescription?.metadata?.medicalRecordNumber ||
        patient?.recordNumber ||
        null,
      legalNotes:
        safePrescription?.metadata?.legalNotes ||
        safePrescription?.ePrescription?.legalNotes ||
        null,
    },
    clinicalInfo: {
      allergies:
        safePrescription?.clinicalInfo?.allergies ||
        patient?.allergies ||
        null,
      history: safePrescription?.clinicalInfo?.history || null,
      diagnosis: safePrescription?.clinicalInfo?.diagnosis || null,
      notes:
        safePrescription?.clinicalInfo?.notes ||
        safePrescription?.clinicalNotes ||
        null,
    },
    medications: (safePrescription?.medications || []).map((medication) => ({
      id: medication?.id,
      name: medication?.name,
      dosage: medication?.dosage,
      pharmaceuticalForm: medication?.pharmaceuticalForm || medication?.form,
      posology: medication?.posology || medication?.instruction,
      frequency: medication?.frequency,
      duration: medication?.duration,
      quantity: medication?.quantity,
      specialInstructions:
        medication?.specialInstructions ||
        medication?.notes ||
        medication?.indication,
    })),
  };
};
