import { storage } from '../../providers/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { logError } from '../lib/logger';

export const uploadPrescriptionPDF = async (prescriptionId, pdfBlob) => {
  try {
    const storageRef = ref(storage, `prescriptions/${prescriptionId}.pdf`);
    await uploadBytes(storageRef, pdfBlob);
    return await getDownloadURL(storageRef);
  } catch (error) {
    logError('Erreur lors de la mise à jour du fichier', error, {
      feature: 'storage',
      action: 'uploadPrescriptionPDF',
      prescriptionId,
    });
    throw error;
  }
};
