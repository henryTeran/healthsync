import { httpsCallable } from "firebase/functions";
import { functions } from "../../../providers/firebase";
import { logError } from "../../../shared/lib/logger";

const mapSigningErrorToMessage = (error) => {
  const code = error?.code || "";
  const message = String(error?.message || "");

  if (code.includes("unauthenticated")) {
    return "Session expirée. Veuillez vous reconnecter.";
  }

  if (code.includes("failed-precondition") || message.toLowerCase().includes("stupéfiants")) {
    return "La signature e-Rezept a été refusée: présence de données non conformes (ex: stupéfiants).";
  }

  if (code.includes("invalid-argument")) {
    return "Données e-Rezept incomplètes ou invalides pour signature/enregistrement.";
  }

  return "Le service e-Rezept n'a pas pu signer/enregistrer le dataset.";
};

export const signAndRegisterSwissEPrescriptionUseCase = async (payload) => {
  const callable = httpsCallable(functions, "signAndRegisterSwissEPrescription");

  try {
    const result = await callable({ payload });
    const data = result?.data;

    if (!data?.signedRegisteredToken || !data?.datasetChecksum) {
      throw new Error("Réponse de signature e-Rezept incomplète.");
    }

    return data;
  } catch (error) {
    logError("Erreur signature/enregistrement e-Rezept", error, {
      feature: "prescriptions",
      action: "signAndRegisterSwissEPrescriptionUseCase",
    });

    throw new Error(mapSigningErrorToMessage(error));
  }
};
