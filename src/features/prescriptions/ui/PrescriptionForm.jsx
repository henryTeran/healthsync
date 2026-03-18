import React, { useState, useEffect } from "react";
import {
  getPrescriptionById,
  updatePrescription,
  updatePrescriptionStatus,
} from "../../../features/prescriptions";
import { PrescriptionPDFDownload } from "./PrescriptionPDF";
import PropTypes from "prop-types";
import { sendPrescriptionByEmail } from "../../../shared/services/emailService";
import { sendPrescriptionNotification } from "../../../features/notifications";
import { getUserProfile } from "../../../features/profile";
import { jsPDF } from "jspdf"; 
import html2canvas from "html2canvas";
import { uploadPrescriptionPDF } from "../../../shared/services/storageService";
import { logDebug, logError } from "../../../shared/lib/logger";
import { PRESCRIPTION_STATUS } from "../domain/prescriptionStatus";
import { FileDown, Mail, Send, ShieldCheck } from "lucide-react";


export const PrescriptionForm = ({ prescriptionId, onStatusChange }) => {
  const [prescription, setPrescription] = useState(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSendingApp, setIsSendingApp] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const printRef = React.createRef();


  useEffect(() => {
    const fetchPrescription = async () => {
      try {
        logDebug("Chargement prescription", {
          feature: "prescriptions",
          action: "fetchPrescription",
          prescriptionId,
        });
        const data = await getPrescriptionById(prescriptionId);

        // Récupération des profils du médecin et du patient
        const [profilPatient, profilDoctor] = await Promise.all([
          getUserProfile(data.patientId),
          getUserProfile(data.createdBy),
        ]);

        const fullData = { ...data, profilDoctor, profilPatient };
        setPrescription(fullData);
        onStatusChange?.(fullData.status);
      } catch (error) {
        logError("Erreur lors de la récupération de la prescription", error, {
          feature: "prescriptions",
          action: "fetchPrescription",
          prescriptionId,
        });
      }
    };
    fetchPrescription();
  }, [prescriptionId]);



  const handleSendEmail = async () => {
    if (prescription) {
      setIsSendingEmail(true);
      try {
        logDebug("Envoi prescription par email", {
          feature: "prescriptions",
          action: "handleSendEmail",
          prescriptionId: prescription?.id,
        });
        await sendPrescriptionByEmail(prescription.profilPatient.email, prescription);
      } finally {
        setIsSendingEmail(false);
      }
    }
  };

  const handleSendNotification = async () => {
    if (prescription) {
      setIsSendingApp(true);
      try {
        await sendPrescriptionNotification(prescription.patientId, prescription.id);
        await updatePrescriptionStatus(prescription.id, PRESCRIPTION_STATUS.SENT);
        setPrescription((prev) => ({ ...prev, status: PRESCRIPTION_STATUS.SENT }));
        onStatusChange?.(PRESCRIPTION_STATUS.SENT);
        alert("Notification envoyée au patient !");
      } finally {
        setIsSendingApp(false);
      }
    }
  };

  const getStatusBadgeClasses = (status) => {
    if (status === PRESCRIPTION_STATUS.SENT) return "bg-medical-100 text-medical-700";
    if (
      status === PRESCRIPTION_STATUS.VALIDATED_BY_PATIENT ||
      status === PRESCRIPTION_STATUS.ACTIVE ||
      status === PRESCRIPTION_STATUS.COMPLETED
    ) {
      return "bg-health-100 text-health-700";
    }
    return "bg-neutral-100 text-neutral-700";
  };

  const getStatusLabel = (status) => {
    if (status === PRESCRIPTION_STATUS.SENT) return "Envoyé";
    if (status === PRESCRIPTION_STATUS.VALIDATED_BY_PATIENT) return "Validé patient";
    if (status === PRESCRIPTION_STATUS.ACTIVE) return "Actif";
    if (status === PRESCRIPTION_STATUS.COMPLETED) return "Terminé";
    return "Brouillon";
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
    setIsGeneratingPdf(true);
  
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
      await updatePrescription(prescription.id, {
        pdfUrl,
        pdfMeta: {
          generatedAt: new Date().toISOString(),
          version: (prescription?.pdfMeta?.version || 0) + 1,
        },
      });
      await updatePrescriptionStatus(prescription.id, PRESCRIPTION_STATUS.PDF_GENERATED);
      setPrescription((prev) => ({ ...prev, status: PRESCRIPTION_STATUS.PDF_GENERATED }));
      onStatusChange?.(PRESCRIPTION_STATUS.PDF_GENERATED);
  
      alert("Prescription enregistrée et téléchargé avec succès !");
    } catch (error) {
      logError("Erreur lors de l'enregistrement du PDF", error, {
        feature: "prescriptions",
        action: "handleDownLoadPdf",
        prescriptionId: prescription?.id,
      });
    } finally {
      setIsGeneratingPdf(false);
    }
    pdf.save("prescription.pdf");
  };

  return (
    <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold text-neutral-900">Panneau Ordonnance</h2>
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClasses(prescription?.status)}`}>
          <ShieldCheck className="h-3.5 w-3.5" />
          {getStatusLabel(prescription?.status)}
        </span>
      </div>

      {prescription ? (
        <div ref={printRef} className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-4 shadow-inner">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <section className="rounded-xl bg-neutral-50 border border-neutral-200 p-4">
              <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">Médecin</p>
              <p className="font-bold text-neutral-900">
              Dr {prescription.profilDoctor.firstName} {prescription.profilDoctor.lastName}
              </p>
              <p className="text-sm text-neutral-700">{prescription.profilDoctor.address}</p>
              <p className="text-sm text-neutral-700">{prescription.profilDoctor.postalCode} {prescription.profilDoctor.state}</p>
              <p className="text-sm font-medium text-neutral-800">{prescription.profilDoctor.mobileNumber}</p>
            </section>

            <section className="rounded-xl bg-neutral-50 border border-neutral-200 p-4">
              <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">Patient</p>
              <p className="font-semibold text-neutral-900">
                {prescription.profilPatient.gender === "female" ? "Mme" : "M."} {prescription.profilPatient.firstName} {prescription.profilPatient.lastName}
              </p>
              <p className="text-sm text-neutral-700">Âge: {prescription.profilPatient.age} ans</p>
              <p className="text-sm text-neutral-700">
                Date de naissance: {prescription.profilPatient && prescription.profilPatient.dateOfBirth
                  ? formatDate(prescription.profilPatient.dateOfBirth)
                  : "Date inconnue"}
              </p>
              <p className="text-sm text-neutral-700 mt-1">Création: {new Date(prescription.creationDate).toLocaleDateString("fr-FR")}</p>
            </section>
          </div>

          <section className="rounded-xl border border-neutral-200 p-4">
            <p className="text-xs uppercase tracking-wide text-neutral-500 mb-3">Prescription</p>
            <div className="space-y-2">
              {prescription.medications.map((med, index) => (
                <div key={index} className="rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2">
                  <p className="text-sm font-semibold text-neutral-900">{med.name} {med.dosage}</p>
                  <p className="text-xs text-neutral-600">{med.frequency} • {med.duration}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl bg-neutral-50 border border-neutral-200 p-4 text-center">
            <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">Signature</p>
            <p className="text-sm text-neutral-700">Dr {prescription.profilDoctor.firstName} {prescription.profilDoctor.lastName}</p>
          </section>
        </div>
      ) : (
        <p>Chargement...</p>
      )}

      <div className="flex flex-wrap gap-2 mt-6">
        <button
          type="button"
          onClick={handleDownLoadPdf}
          disabled={!prescription || isGeneratingPdf}
          className="inline-flex items-center gap-2 rounded-full bg-medical-600 px-4 py-2 text-sm font-medium text-white hover:bg-medical-700 transition disabled:opacity-60"
        >
          <FileDown className="h-4 w-4" />
          {isGeneratingPdf ? "Génération..." : "Générer PDF"}
        </button>

        <button
          type="button"
          onClick={handleSendNotification}
          disabled={!prescription || isSendingApp}
          className="inline-flex items-center gap-2 rounded-full bg-health-600 px-4 py-2 text-sm font-medium text-white hover:bg-health-700 transition disabled:opacity-60"
        >
          <Send className="h-4 w-4" />
          {isSendingApp ? "Envoi..." : "Envoyer via App"}
        </button>

        <button
          type="button"
          onClick={handleSendEmail}
          disabled={!prescription || isSendingEmail}
          className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition disabled:opacity-60"
        >
          <Mail className="h-4 w-4" />
          {isSendingEmail ? "Envoi..." : "Email"}
        </button>
      </div>
    </div>

  );
};

PrescriptionForm.propTypes = {
  prescriptionId: PropTypes.string.isRequired,
  onStatusChange: PropTypes.func,
};

PrescriptionForm.defaultProps = {
  onStatusChange: undefined,
};

