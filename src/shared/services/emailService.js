import emailjs from 'emailjs-com';
import { logError } from '../lib/logger';

export const sendPrescriptionByEmail = async (email, prescription) => {
  let emailto = email;

  try {
    emailto = 'henryteranc@hotmail.com';
    const templateParams = {
      to_email: emailto,
      subject: 'Votre Prescription Médicale',
      message: `Bonjour, vous avez reçu une nouvelle prescription de votre médecin.\n\nDétails :\n${prescription.medications
        .map((med) => `${med.name} - ${med.dosage}, ${med.frequency}`)
        .join('\n')}`,
    };

    await emailjs.send(
      'healthsync_service',
      'template_3r8z2af',
      templateParams,
      'xZiaWwWG4X44LV4sB'
    );
  } catch (error) {
    logError("Erreur lors de l'envoi de l'email", error, {
      feature: 'email',
      action: 'sendPrescriptionByEmail',
      hasErrorText: Boolean(error?.text),
      errorText: error?.text,
    });
  }
};
