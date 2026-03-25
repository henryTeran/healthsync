import { useCallback, useEffect, useRef, useState } from "react";
import {
  getPrescriptionById,
  updatePrescription,
  updatePrescriptionStatus,
} from "../../../features/prescriptions";
import PropTypes from "prop-types";
import { sendPrescriptionByEmail } from "../../../shared/services/emailService";
import { sendPrescriptionNotification } from "../../../features/notifications";
import { getUserProfile } from "../../../features/profile";
import { jsPDF } from "jspdf"; 
import html2canvas from "html2canvas";
import { uploadPrescriptionPDF } from "../../../shared/services/storageService";
import { logDebug, logError } from "../../../shared/lib/logger";
import { PRESCRIPTION_STATUS } from "../domain/prescriptionStatus";
import { FileDown, Mail, Send } from "lucide-react";
import {
  PrescriptionDocumentPreview,
  PrescriptionEmptyState,
  PrescriptionPreviewPanel,
} from "../../medications/ui/components/MedicalUiComponents";


export const PrescriptionForm = ({ prescriptionId, onStatusChange, refreshToken }) => {
  const [prescription, setPrescription] = useState(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSendingApp, setIsSendingApp] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const printRef = useRef(null);
  // Élément hors-écran dédié à la capture PDF (pas de décorations UI)
  const pdfRef = useRef(null);

  // Stabiliser le callback pour éviter les re-renders infinis
  const stableOnStatusChange = useCallback(
    (status) => onStatusChange?.(status),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

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
        stableOnStatusChange(fullData.status);
      } catch (error) {
        logError("Erreur lors de la récupération de la prescription", error, {
          feature: "prescriptions",
          action: "fetchPrescription",
          prescriptionId,
        });
      }
    };
    fetchPrescription();
  }, [prescriptionId, refreshToken, stableOnStatusChange]);



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
        let nextStatus = prescription.status;

        if (nextStatus === PRESCRIPTION_STATUS.CREATED) {
          await updatePrescriptionStatus(prescription.id, PRESCRIPTION_STATUS.PDF_GENERATED);
          nextStatus = PRESCRIPTION_STATUS.PDF_GENERATED;
        }

        if (
          nextStatus !== PRESCRIPTION_STATUS.PDF_GENERATED &&
          nextStatus !== PRESCRIPTION_STATUS.UPDATED &&
          nextStatus !== PRESCRIPTION_STATUS.SENT &&
          nextStatus !== PRESCRIPTION_STATUS.RECEIVED &&
          nextStatus !== PRESCRIPTION_STATUS.VALIDATED_BY_PATIENT &&
          nextStatus !== PRESCRIPTION_STATUS.ACTIVE &&
          nextStatus !== PRESCRIPTION_STATUS.COMPLETED
        ) {
          throw new Error(`Impossible d'envoyer la prescription depuis le statut ${nextStatus}.`);
        }

        await sendPrescriptionNotification(prescription.patientId, prescription.id);
        if (nextStatus !== PRESCRIPTION_STATUS.SENT) {
          await updatePrescriptionStatus(prescription.id, PRESCRIPTION_STATUS.SENT);
        }
        setPrescription((prev) => ({ ...prev, status: PRESCRIPTION_STATUS.SENT }));
        onStatusChange?.(PRESCRIPTION_STATUS.SENT);
        alert("Notification envoyée au patient !");
      } catch (error) {
        alert(error.message || "Erreur lors de l'envoi de la notification.");
        logError("Erreur envoi notification ordonnance", error, {
          feature: "prescriptions",
          action: "handleSendNotification",
          prescriptionId: prescription?.id,
        });
      } finally {
        setIsSendingApp(false);
      }
    }
  };

  const getStatusLabel = (status) => {
    if (status === PRESCRIPTION_STATUS.PDF_GENERATED) return "PDF généré";
    if (status === PRESCRIPTION_STATUS.SENT) return "Envoyé";
    if (status === PRESCRIPTION_STATUS.RECEIVED) return "Reçu";
    if (status === PRESCRIPTION_STATUS.VALIDATED_BY_PATIENT) return "Validé patient";
    if (status === PRESCRIPTION_STATUS.ACTIVE) return "Actif";
    if (status === PRESCRIPTION_STATUS.COMPLETED) return "Terminé";
    return "Brouillon";
  };

  const canSendViaApp = [
    PRESCRIPTION_STATUS.PDF_GENERATED,
    PRESCRIPTION_STATUS.UPDATED,
    PRESCRIPTION_STATUS.SENT,
    PRESCRIPTION_STATUS.RECEIVED,
    PRESCRIPTION_STATUS.VALIDATED_BY_PATIENT,
    PRESCRIPTION_STATUS.ACTIVE,
    PRESCRIPTION_STATUS.COMPLETED,
  ].includes(prescription?.status);

  const handleDownLoadPdf = async () => {
    // Capture depuis l'élément off-screen dédié (pas de border/shadow)
    const element = pdfRef.current;
    if (!element) return;
    setIsGeneratingPdf(true);

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        // onclone : supprime border et shadow du shell A4 dans la copie DOM
        onclone: (clonedDoc) => {
          const docEl = clonedDoc.querySelector('[data-pdf-document]');
          if (docEl) {
            docEl.style.border = 'none';
            docEl.style.boxShadow = 'none';
            docEl.style.maxWidth = '100%';
            docEl.style.width = '100%';
            docEl.style.margin = '0';
          }
        },
      });

      const imgData = canvas.toDataURL("image/png");

      // jsPDF en mm — A4 = 210 × 297 mm
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidthMm = pdf.internal.pageSize.getWidth();   // 210
      const pageHeightMm = pdf.internal.pageSize.getHeight(); // 297
      const imgHeightMm = (canvas.height / canvas.width) * pageWidthMm;

      // Multi-page : découpe l'image en tranches de hauteur pageHeightMm
      let yOffset = 0;
      while (yOffset < imgHeightMm) {
        if (yOffset > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, -yOffset, pageWidthMm, imgHeightMm);
        yOffset += pageHeightMm;
      }

      const pdfBlob = pdf.output("blob");

      // Upload Firebase Storage
      const pdfUrl = await uploadPrescriptionPDF(prescription.id, pdfBlob);

      // Mise à jour Firestore
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

      // Téléchargement local
      pdf.save(`ordonnance-${prescription.id.slice(-8)}.pdf`);
      alert("Prescription générée et téléchargée avec succès !");
    } catch (error) {
      logError("Erreur lors de l'enregistrement du PDF", error, {
        feature: "prescriptions",
        action: "handleDownLoadPdf",
        prescriptionId: prescription?.id,
      });
      alert("Erreur lors de la génération du PDF.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const actions = (
    <>
      <button
        type="button"
        onClick={handleDownLoadPdf}
        disabled={!prescription || isGeneratingPdf}
        className="h-11 rounded-xl bg-medical-600 px-5 font-medium text-white hover:bg-medical-700 inline-flex items-center gap-2 disabled:opacity-60"
      >
        <FileDown className="h-4 w-4" />
        {isGeneratingPdf ? "Génération..." : "Générer PDF"}
      </button>

      <button
        type="button"
        onClick={handleSendNotification}
        disabled={!prescription || isSendingApp || !canSendViaApp}
        title={!canSendViaApp ? "Générez d'abord le PDF pour activer l'envoi via App." : undefined}
        className="h-11 rounded-xl bg-medical-600 px-5 font-medium text-white hover:bg-medical-700 inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Send className="h-4 w-4" />
        {isSendingApp ? "Envoi..." : "Envoyer via App"}
      </button>

      <button
        type="button"
        onClick={handleSendEmail}
        disabled={!prescription || isSendingEmail}
        className="h-11 rounded-xl border border-neutral-200 bg-white px-5 text-neutral-700 hover:bg-neutral-50 inline-flex items-center gap-2 disabled:opacity-60"
      >
        <Mail className="h-4 w-4" />
        {isSendingEmail ? "Envoi..." : "Envoyer Email"}
      </button>
    </>
  );

  return (
    <>
      {/* Élément off-screen dédié à la capture PDF — 720px fixe, sans border/shadow */}
      <div
        ref={pdfRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          width: '720px',
          background: '#ffffff',
          zIndex: -1,
          pointerEvents: 'none',
        }}
      >
        {prescription && (
          <PrescriptionDocumentPreview
            prescription={prescription}
            patient={prescription.profilPatient}
            doctor={prescription.profilDoctor}
          />
        )}
      </div>

      <PrescriptionPreviewPanel
        title="Aperçu ordonnance"
        subtitle="Document clinique réaliste pour prévisualisation, impression PDF et envoi au patient."
        status={getStatusLabel(prescription?.status)}
        actions={actions}
      >
        {prescription ? (
          <div ref={printRef}>
            <PrescriptionDocumentPreview
              prescription={prescription}
              patient={prescription?.profilPatient}
              doctor={prescription?.profilDoctor}
            />
          </div>
        ) : (
          <PrescriptionEmptyState
            title="Document en préparation"
            description="L'ordonnance apparaîtra ici dès que les données cliniques seront chargées et prêtes à être générées au format document médical."
          />
        )}
      </PrescriptionPreviewPanel>
    </>
  );
};

PrescriptionForm.propTypes = {
  prescriptionId: PropTypes.string.isRequired,
  onStatusChange: PropTypes.func,
  refreshToken: PropTypes.number,
};

PrescriptionForm.defaultProps = {
  onStatusChange: undefined,
  refreshToken: 0,
};

