import React, { useState, useEffect } from "react";
import { getPrescriptionById, updatePrescription } from "../services/prescriptionService"; // Fonction pour récupérer la prescription
import { PrescriptionPDFDownload } from "./PrescriptionPDF";
import PropTypes from "prop-types";
import { sendPrescriptionByEmail } from "../services/emailService";
import { sendPrescriptionNotification } from "../services/notificationService";
import { getUserProfile } from "../services/profileService";
import { jsPDF } from "jspdf"; 
import html2canvas from "html2canvas";
import { uploadPrescriptionPDF } from "../services/storageService";


export const PrescriptionForm = ({ prescriptionId }) => {
  const [prescription, setPrescription] = useState(null);
  const [patientProfil, setPatientProfil] = useState(null);
  const [doctorProfil, setDoctorProfil] = useState(null);
  const printRef = React.createRef();


  useEffect(() => {
    const fetchPrescription = async () => {
      try {
        console.log("Données paramètre :", prescriptionId);
        const data = await getPrescriptionById(prescriptionId);
        console.log("Données de la prescription :", data);

        // Récupération des profils du médecin et du patient
        const [profilPatient, profilDoctor] = await Promise.all([
          getUserProfile(data.patientId),
          getUserProfile(data.createdBy),
        ]);

        setPatientProfil(profilPatient);
        setDoctorProfil(profilDoctor);

        // Ajout des profils dans la prescription
        const fullData = { ...data, profilDoctor, profilPatient };
        setPrescription(fullData);
      } catch (error) {
        console.error("Erreur lors de la récupération de la prescription :", error);
      }
    };
    fetchPrescription();
  }, [prescriptionId]);



  const handleSendEmail = async () => {
    if (prescription) {
      console.log("Données de la prescription :", prescription);
      await sendPrescriptionByEmail(prescription.profilPatient.email, prescription);
    }
  };

  const handleSendNotification = async () => {
    if (prescription) {
      await sendPrescriptionNotification(prescription.patientId, prescription.id);
      alert("Notification envoyée au patient !");
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp || !timestamp.seconds) return "Date inconnue";
    
    const date = new Date(timestamp.seconds * 1000); // Convertir en millisecondes
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };
  const handleDownLoadPdf = async () => {
    const element = printRef.current;
    if (!element) return; 
  
    // Capture de l'élément HTML en image
    const canvas = await html2canvas(element, { scale: 2 });
    const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: "a4" });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
  
    pdf.addImage(canvas.toDataURL("image/png"), 'PNG', 0, 0, pdfWidth, pdfHeight);
    const pdfBlob = pdf.output("blob");
  
    try {
      // Telechargement du PDF dans Firebase Storage
      const pdfUrl = await uploadPrescriptionPDF(prescription.id, pdfBlob);
  
      // Mise à jour de Firestore avec l'URL du PDF
      await updatePrescription(prescription.id, { pdfUrl });
  
      alert("Prescription enregistrée et téléchargé avec succès !");
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du PDF :", error);
    }
    pdf.save("prescription.pdf");
  };

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6">
      <h2 className="text-lg font-semibold mb-4">Détails de la Prescription</h2>
      {prescription ? (
        <div ref = {printRef} className="max-w-md mx-auto  p-6 rounded-lg  relative">
          {/* Titre Ordonnance */}
          <div className="absolute top-6 right-6 text-red-600 font-bold text-lg">
            EXEMPLE <br /> ORDONNANCE
          </div>

          {/* Entête Médecin */}
          <div className="mb-4">
            <p className="font-bold text-lg">
              Dr {prescription.profilDoctor.firstName} {prescription.profilDoctor.lastName}
            </p>
            <p className="text-sm">{prescription.profilDoctor.address}</p>
            <p className="text-sm">
              {prescription.profilDoctor.postalCode} {prescription.profilDoctor.state}
            </p>
            <p className="text-sm font-bold">
              Téléphone {prescription.profilDoctor.mobileNumber}
            </p>
          </div>

          {/* Date et Informations du Patient */}
          <div className="mb-4 flex justify-between text-sm">
            <span>Rp.</span>
            <span className="font-bold">
              {new Date(prescription.creationDate).toLocaleDateString()}
            </span>
          </div>
          <div className="mb-2">
          <p className="font-semibold">
            {prescription.profilPatient.gender === "female" ? "Mme" : "M."}{" "}
            {prescription.profilPatient.firstName} {prescription.profilPatient.lastName} - {prescription.profilPatient.age} ans
            <br />
            Date de naissance : {prescription.profilPatient && prescription.profilPatient.dateOfBirth 
                ? formatDate(prescription.profilPatient.dateOfBirth) 
                : "Date inconnue"}
            </p>
          </div>

          {/* Médicaments */}
          {prescription.medications.map((med, index) => (
            <div key={index} className="border-t border-gray-300 pt-2 mt-2">
              <p className="font-bold">
                {med.name} {med.dosage}
              </p>
              <p className="text-sm">{med.frequency} pendant {med.duration}</p> 
            </div>
          ))}

          {/* Signature */}
          <div className="border-t border-gray-300 pt-4 mt-4 text-center">
            <p className="text-sm">Signature et timbre du médecin</p>
            <div className="w-24 h-12 mx-auto my-2  border-white-400"></div>
            <p className="font-bold">
              Dr {prescription.profilDoctor.firstName} {prescription.profilDoctor.lastName}
            </p>
          </div>
       </div>
      
    ) : (
        <p>Chargement...</p>
      )}
        {/* Boutons d'action */}
        <div className="flex justify-center gap-4 mt-6">
            <button
                onClick={handleDownLoadPdf}
                className="mt-2 bg-blue-500 text-white p-2 rounded"
            >
                Enregistrer PDF
            </button>
            <button
                onClick={handleSendEmail}
                className="mt-2 bg-green-500 text-white p-2 rounded"
            >
                Envoyer par Email
            </button>
            <button
                onClick={handleSendNotification}
                className="mt-2 bg-yellow-500 text-white p-2 rounded"
            >
                Envoyer via l'app
            </button>
        </div>

        {/* Téléchargement PDF */}
        <div className="mt-4">
            {/* <PrescriptionPDFDownload prescription={prescription} /> */}
        </div>    
    </div>

  );
};

PrescriptionForm.propTypes = {
  prescriptionId: PropTypes.string.isRequired,
};

