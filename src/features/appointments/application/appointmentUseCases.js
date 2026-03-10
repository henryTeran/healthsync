import { getAuth } from "firebase/auth";
import moment from "moment";
import { getUserProfile } from "../../profile";
import { addNotification } from "../../notifications";
import {
  createAppointmentRecord,
  createAvailabilityRecord,
  deleteAppointmentRecord,
  deleteAvailabilityRecord,
  findAppointmentsByField,
  findAvailabilitiesByDoctor,
  getAppointmentByIdRecord,
  updateAppointmentRecord,
  updateAvailabilityRecord,
} from "../infrastructure/appointmentRepository.firebase";

export const getAppointmentsByUserUseCase = async (userId, userType) => {
  try {
    const field = userType === "patient" ? "patientId" : "doctorId";
    const querySnapshot = await findAppointmentsByField(field, userId);

    if (querySnapshot.empty) {
      return [];
    }

    const appointments = await Promise.all(
      querySnapshot.docs.map(async (item) => {
        const appointmentData = { id: item.id, ...item.data() };

        try {
          if (appointmentData.patientId) {
            const patientProfile = await getUserProfile(appointmentData.patientId);
            appointmentData.patientName = patientProfile
              ? `${patientProfile.firstName} ${patientProfile.lastName}`
              : "Patient inconnu";
          }

          if (appointmentData.doctorId) {
            const doctorProfile = await getUserProfile(appointmentData.doctorId);
            appointmentData.doctorName = doctorProfile
              ? `Dr. ${doctorProfile.firstName} ${doctorProfile.lastName}`
              : "Médecin inconnu";
          }
        } catch (error) {
          console.error("Erreur lors de la récupération des profils:", error);
        }

        return appointmentData;
      })
    );

    return appointments;
  } catch (error) {
    console.error(" Erreur lors de la récupération des rendez-vous :", error);
    throw new Error(error.message);
  }
};

export const updateAppointmentUseCase = async (appointmentId, updatedData) => {
  try {
    const oldAppointment = await getAppointmentByIdRecord(appointmentId);
    const oldData = oldAppointment.data();

    await updateAppointmentRecord(appointmentId, {
      ...updatedData,
      updatedAt: new Date().toISOString(),
    });

    if (updatedData.date !== oldData.date || updatedData.time !== oldData.time) {
      const [doctorProfile, patientProfile] = await Promise.all([
        getUserProfile(oldData.doctorId),
        getUserProfile(oldData.patientId),
      ]);

      await addNotification(oldData.patientId, {
        type: "appointment_updated",
        message: `Votre rendez-vous avec Dr. ${doctorProfile?.firstName} ${doctorProfile?.lastName} a été modifié. Nouvelle date: ${moment(updatedData.date).format("DD/MM/YYYY")} à ${updatedData.time}`,
        appointmentId,
        read: false,
      });

      await addNotification(oldData.doctorId, {
        type: "appointment_updated",
        message: `Le rendez-vous avec ${patientProfile?.firstName} ${patientProfile?.lastName} a été modifié. Nouvelle date: ${moment(updatedData.date).format("DD/MM/YYYY")} à ${updatedData.time}`,
        appointmentId,
        read: false,
      });

      await scheduleAppointmentReminderUseCase(
        {
          id: appointmentId,
          ...oldData,
          ...updatedData,
        },
        24
      );
    }
  } catch (error) {
    console.error("Erreur lors de la mise à jour du rendez-vous:", error);
    throw new Error(error.message);
  }
};

export const deleteAppointmentUseCase = async (appointmentId) => {
  try {
    const appointmentDoc = await getAppointmentByIdRecord(appointmentId);

    if (appointmentDoc.exists()) {
      const appointmentData = appointmentDoc.data();

      const [doctorProfile, patientProfile] = await Promise.all([
        getUserProfile(appointmentData.doctorId),
        getUserProfile(appointmentData.patientId),
      ]);

      await addNotification(appointmentData.patientId, {
        type: "appointment_cancelled",
        message: `Votre rendez-vous avec Dr. ${doctorProfile?.firstName} ${doctorProfile?.lastName} du ${moment(appointmentData.date).format("DD/MM/YYYY")} à ${appointmentData.time} a été annulé`,
        appointmentId,
        read: false,
      });

      await addNotification(appointmentData.doctorId, {
        type: "appointment_cancelled",
        message: `Le rendez-vous avec ${patientProfile?.firstName} ${patientProfile?.lastName} du ${moment(appointmentData.date).format("DD/MM/YYYY")} à ${appointmentData.time} a été annulé`,
        appointmentId,
        read: false,
      });
    }

    await deleteAppointmentRecord(appointmentId);
  } catch (error) {
    console.error("Erreur lors de la suppression du rendez-vous:", error);
    throw new Error(error.message);
  }
};

export const scheduleAppointmentReminderUseCase = async (
  appointment,
  reminderHours = 24
) => {
  const { patientId, doctorId, date, time, id, reason } = appointment;
  const appointmentDate = new Date(date + "T" + time);
  const reminderDate = new Date(
    appointmentDate.getTime() - reminderHours * 60 * 60 * 1000
  );

  try {
    const [doctorProfile, patientProfile] = await Promise.all([
      getUserProfile(doctorId),
      getUserProfile(patientId),
    ]);

    await addNotification(patientId, {
      type: "appointment_reminder",
      message: `🔔 Rappel: Vous avez un rendez-vous avec Dr. ${doctorProfile?.firstName} ${doctorProfile?.lastName} le ${moment(appointmentDate).format("DD/MM/YYYY")} à ${time} (${reason || "Consultation"})`,
      appointmentId: id,
      scheduledFor: reminderDate.toISOString(),
      read: false,
    });

    await addNotification(doctorId, {
      type: "appointment_reminder",
      message: `🔔 Rappel: Rendez-vous avec ${patientProfile?.firstName} ${patientProfile?.lastName} le ${moment(appointmentDate).format("DD/MM/YYYY")} à ${time} (${reason || "Consultation"})`,
      appointmentId: id,
      scheduledFor: reminderDate.toISOString(),
      read: false,
    });

    console.log(`✅ Rappels programmés pour ${reminderDate.toLocaleString()}`);
  } catch (error) {
    console.error("Erreur lors de la programmation des rappels:", error);
  }
};

export const createAppointmentUseCase = async (appointmentData) => {
  try {
    const auth = getAuth();
    if (!auth.currentUser) {
      throw new Error("Utilisateur non authentifié.");
    }

    appointmentData.status = "en attente";
    const appointmentRef = await createAppointmentRecord(appointmentData);

    console.log("RDV ajouté avec succès :", appointmentRef.id);

    const patientProfile = await getUserProfile(appointmentData.patientId);
    await addNotification(appointmentData.doctorId, {
      type: "new_appointment_request",
      message: `Nouvelle demande de RDV de ${patientProfile?.firstName} ${patientProfile?.lastName} pour le ${appointmentData.date} à ${appointmentData.time}`,
      patientId: appointmentData.patientId,
      appointmentId: appointmentRef.id,
      urgency: appointmentData.urgency || "normal",
      read: false,
    });

    await scheduleAppointmentReminderUseCase(
      {
        id: appointmentRef.id,
        ...appointmentData,
      },
      appointmentData.reminderTime || 24
    );

    return appointmentRef.id;
  } catch (error) {
    throw new Error(error.message);
  }
};

const getAppointmentByIdUseCase = async (appointmentId) => {
  try {
    const appointmentDoc = await getAppointmentByIdRecord(appointmentId);

    if (appointmentDoc.exists()) {
      return { id: appointmentDoc.id, ...appointmentDoc.data() };
    }
    throw new Error("Rendez-vous introuvable");
  } catch (error) {
    console.error("Erreur lors de la récupération du rendez-vous:", error);
    throw error;
  }
};

export const sendAppointmentConfirmationUseCase = async (
  appointmentId,
  status,
  doctorId,
  patientId
) => {
  try {
    const [doctorProfile] = await Promise.all([
      getUserProfile(doctorId),
      getUserProfile(patientId),
    ]);

    const appointment = await getAppointmentByIdUseCase(appointmentId);

    if (status === "accepté") {
      await addNotification(patientId, {
        type: "appointment_confirmed",
        message: `✅ Votre rendez-vous avec Dr. ${doctorProfile?.firstName} ${doctorProfile?.lastName} du ${moment(appointment.date).format("DD/MM/YYYY")} à ${appointment.time} a été confirmé`,
        appointmentId,
        read: false,
      });

      await scheduleAppointmentReminderUseCase(appointment, 24);
      await scheduleAppointmentReminderUseCase(appointment, 1);
    } else if (status === "refusé") {
      await addNotification(patientId, {
        type: "appointment_rejected",
        message: `❌ Votre demande de rendez-vous avec Dr. ${doctorProfile?.firstName} ${doctorProfile?.lastName} du ${moment(appointment.date).format("DD/MM/YYYY")} à ${appointment.time} a été refusée`,
        appointmentId,
        read: false,
      });
    }
  } catch (error) {
    console.error("Erreur lors de l'envoi de la confirmation:", error);
  }
};

export const getUnavailabilitiesByDoctorUseCase = async (doctorId) => {
  try {
    console.log("🔍 Recherche des indisponibilités pour le docteur:", doctorId);
    const snapshot = await findAvailabilitiesByDoctor(doctorId);
    const unavailabilities = snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    }));
    console.log("📊 Indisponibilités trouvées:", unavailabilities);
    return unavailabilities;
  } catch (error) {
    console.error("Erreur lors de la récupération des disponibilités :", error);
    throw new Error("Impossible de récupérer les disponibilités.");
  }
};

export const addDoctorAvailabilityUseCase = async (
  doctorId,
  startDate,
  endDate,
  type,
  notes = ""
) => {
  try {
    const newAvailability = {
      doctorId,
      start: startDate,
      end: endDate,
      type,
      notes,
      createdAt: new Date().toISOString(),
    };

    const docRef = await createAvailabilityRecord(newAvailability);
    return docRef.id;
  } catch (error) {
    console.error("Erreur lors de l'ajout de disponibilité :", error);
    throw new Error("Impossible d'ajouter la disponibilité.");
  }
};

export const deleteUnavailabilityUseCase = async (availabilityId) => {
  try {
    await deleteAvailabilityRecord(availabilityId);
  } catch (error) {
    console.error("Erreur lors de la suppression de la disponibilité :", error);
    throw new Error("Impossible de supprimer la disponibilité.");
  }
};

export const updateUnavailabilityUseCase = async (availabilityId, updatedData) => {
  try {
    await updateAvailabilityRecord(availabilityId, {
      ...updatedData,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la disponibilité :", error);
    throw new Error("Impossible de mettre à jour la disponibilité.");
  }
};
