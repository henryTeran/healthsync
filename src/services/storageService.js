import { storage } from "../providers/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";


export const uploadPrescriptionPDF = async (prescriptionId, pdfBlob) => {
  try {
    const storageRef = ref(storage, `prescriptions/${prescriptionId}.pdf`);
    await uploadBytes(storageRef, pdfBlob);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error("Erreur lors de la mise à jour du fichier :", error);
    throw error;
  }
};
