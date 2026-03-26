import PropTypes from "prop-types";
import { mapPrescriptionToPdfPreview } from "../application/prescriptionPresentationService";
import { PrescriptionDocumentPreview } from "../../medications/ui/components/MedicalUiComponents";

export const SwissEPrescriptionDocument = ({ prescription, patient, doctor }) => {
  const mappedPrescription = mapPrescriptionToPdfPreview({
    prescription,
    patient,
    doctor,
  });

  const hydratedPrescription = {
    ...mappedPrescription,
    id: prescription?.id || mappedPrescription?.id,
    status: prescription?.status || mappedPrescription?.status,
    ePrescription: prescription?.ePrescription || mappedPrescription?.ePrescription,
    clinicalInfo: {
      ...mappedPrescription?.clinicalInfo,
      ...(prescription?.clinicalInfo || {}),
    },
    metadata: {
      ...mappedPrescription?.metadata,
      ...(prescription?.metadata || {}),
    },
  };

  return (
    <PrescriptionDocumentPreview
      prescription={hydratedPrescription}
      patient={patient}
      doctor={doctor}
    />
  );
};

SwissEPrescriptionDocument.propTypes = {
  prescription: PropTypes.shape({
    id: PropTypes.string,
    status: PropTypes.string,
    ePrescription: PropTypes.object,
    clinicalInfo: PropTypes.object,
    metadata: PropTypes.object,
    medications: PropTypes.array,
  }),
  patient: PropTypes.object,
  doctor: PropTypes.object,
};

SwissEPrescriptionDocument.defaultProps = {
  prescription: null,
  patient: null,
  doctor: null,
};
