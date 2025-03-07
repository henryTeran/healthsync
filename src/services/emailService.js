import emailjs from "emailjs-com";

export const sendPrescriptionByEmail = async (email, prescription) => {
  let emailto = email; 
  try {
    emailto = "henryteranc@hotmail.com"
    const templateParams = {
      to_email: emailto,
      subject: "Votre Prescription Médicale",
      message: `Bonjour, vous avez reçu une nouvelle prescription de votre médecin.\n\nDétails :\n${prescription.medications
        .map((med) => `${med.name} - ${med.dosage}, ${med.frequency}`)
        .join("\n")}`,
    };
    console.log(templateParams);

    await emailjs.send("healthsync_service", "template_3r8z2af", templateParams, "xZiaWwWG4X44LV4sB");
    console.log("Email envoyé !");
  }catch (error) {
    console.error("❌ Erreur lors de l'envoi de l'email :", error);
    if (error?.text) {
        console.error("Détail de l'erreur :", error.text);
    }
}

};
 