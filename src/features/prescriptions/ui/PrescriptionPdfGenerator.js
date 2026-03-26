import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const DEFAULT_CAPTURE_OPTIONS = {
  scale: 2,
  useCORS: true,
  backgroundColor: "#ffffff",
  logging: false,
  onclone: (clonedDoc) => {
    const documentElement = clonedDoc.querySelector("[data-pdf-document]");
    if (documentElement) {
      documentElement.style.border = "none";
      documentElement.style.boxShadow = "none";
      documentElement.style.maxWidth = "100%";
      documentElement.style.width = "100%";
      documentElement.style.margin = "0";
    }
  },
};

export const generatePrescriptionPdfBlob = async ({
  element,
  fileName = "ordonnance.pdf",
  captureOptions = {},
}) => {
  if (!element) {
    throw new Error("Aucun élément à convertir en PDF.");
  }

  const canvas = await html2canvas(element, {
    ...DEFAULT_CAPTURE_OPTIONS,
    ...captureOptions,
  });

  const imageData = canvas.toDataURL("image/png");

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidthMm = pdf.internal.pageSize.getWidth();
  const pageHeightMm = pdf.internal.pageSize.getHeight();
  const imageHeightMm = (canvas.height / canvas.width) * pageWidthMm;

  let verticalOffset = 0;
  while (verticalOffset < imageHeightMm) {
    if (verticalOffset > 0) {
      pdf.addPage();
    }

    pdf.addImage(imageData, "PNG", 0, -verticalOffset, pageWidthMm, imageHeightMm);
    verticalOffset += pageHeightMm;
  }

  const blob = pdf.output("blob");

  return {
    pdf,
    blob,
    fileName,
  };
};

export const downloadGeneratedPdf = ({ pdf, fileName }) => {
  if (!pdf) {
    throw new Error("Document PDF invalide.");
  }

  pdf.save(fileName || "ordonnance.pdf");
};
