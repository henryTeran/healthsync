import React, { Component } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
  getAppointmentsByUser,
  deleteAppointment,
  updateAppointment,
  getDoctorAvailability,
  addDoctorAvailability,
  deleteDoctorAvailability
} from "../../services/appointmentService";
import { getUserProfile } from "../../services/profileService";
import { markNotificationAsRead } from "../../services/notificationService";
import { AuthContext } from "../../contexts/AuthContext";
import PropTypes from "prop-types";
import "moment/locale/fr";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "../../providers/firebase";

moment.locale("fr");
const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(Calendar);

const messages = {
  allDay: "Toute la journée",
  previous: "Précédent",
  next: "Suivant",
  today: "Aujourd'hui",
  month: "Mois",
  week: "Semaine",
  day: "Jour",
  agenda: "Agenda",
  date: "Date",
  time: "Heure",
  event: "Événement",
  showMore: (total) => `+ ${total} plus`
};

export class Appointments extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: null,
      appointments: [],
      doctorAvailability: [],
      isLoading: true,
      error: "",
      showModal: false,
      selectedSlot: null,
      availabilityType: "vacances"
    };
  }

  static contextType = AuthContext;

  componentDidMount() {
    this.fetchAppointments();
    this.fetchDoctorAvailability();
    this.checkNotification();
  }

  fetchAppointments = async () => {
    try {
      const { user } = this.context;
      if (!user) {
        this.setState({ error: "Utilisateur non connecté.", isLoading: false });
        return;
      }
      const profileData = await getUserProfile(user.uid);
      const appointments = await getAppointmentsByUser(user.uid, profileData.type);
      this.setState({ isLoading: false, user, appointments });
    } catch (error) {
      this.setState({ error: error.message, isLoading: false });
    }
  };

  fetchDoctorAvailability = async () => {
    try {
      const { user } = this.context;
      if (!user) return;
  
      const availabilities = await getDoctorAvailability(user.uid);
  
      // 🔍 Vérification des données brutes
      console.log("📅 Disponibilités brutes avant conversion :", availabilities);
  
      // 🔄 Convertir les `Timestamp` en `Date`
      const formattedAvailabilities = availabilities.map(av => ({
        ...av,
        start: av.start.toDate ? av.start.toDate() : new Date(av.start),
        end: av.end.toDate ? av.end.toDate() : new Date(av.end)
      }));
  
      // 🔍 Vérification après conversion
      console.log("✅ Disponibilités formatées :", formattedAvailabilities);
  
      this.setState({ doctorAvailability: formattedAvailabilities });
  
    } catch (error) {
      console.error("❌ Erreur lors du chargement des disponibilités :", error);
    }
  };
  

  checkNotification = async () => {
    const viewedNotificationId = sessionStorage.getItem("viewedNotificationId");
    if (viewedNotificationId) {
      await markNotificationAsRead(viewedNotificationId);
      sessionStorage.removeItem("viewedNotificationId");
    }
  };

  handleSlotSelect = ({ start, end }) => {
    console.log("📌 Sélection de créneau :", start, end); // Vérifie si la sélection est bien détectée
    this.setState({ 
      showModal: true, 
      selectedSlot: { start, end },
      availabilityType: "vacances" // Valeur par défaut
    });
  };
  

  handleAddAvailability = async () => {
    const { user } = this.context;
    const { selectedSlot, availabilityType } = this.state;

    if (!selectedSlot || !user) return;

    try {
      await addDoctorAvailability(user.uid, selectedSlot.start, selectedSlot.end, availabilityType);

      alert("Disponibilité ajoutée !");
      this.setState({ showModal: false, selectedSlot: null });
      this.fetchDoctorAvailability();

    } catch (error) {
      alert("Erreur lors de l'ajout de la disponibilité : " + error.message);
    }
  };
  

  handleDeleteAvailability = async (availabilityId) => {
    try {
      await deleteDoctorAvailability(availabilityId);
      alert("Disponibilité supprimée !");
      this.fetchDoctorAvailability();
    } catch (error) {
      alert(error.message);
    }
  };

  handleEventResizeOrDrop = async ({ event, start, end }) => {
    console.log("🎯 Événement déplacé :", event);
  
    if (event.type === "availability") {
      try {
        console.log("🔄 Mise à jour de la disponibilité...");
  
        // Mise à jour de la disponibilité dans Firebase
        const availabilityRef = doc(db, "availabilities", event.id);
        await updateDoc(availabilityRef, { start, end });
  
        console.log("✅ Disponibilité mise à jour dans Firebase");
  
        // Mise à jour locale et ouverture de la popup
        this.setState((prevState) => ({
          doctorAvailability: prevState.doctorAvailability.map((av) =>
            av.id === event.id ? { ...av, start, end } : av
          ),
          selectedSlot: { start, end }, // ✅ Garde en mémoire la nouvelle plage horaire
          availabilityType: event.title, // ✅ Garde le type existant
          showModal: true, // ✅ Ouvre la popup après le Drag & Drop
        }));
  
        console.log("✅ Popup ouverte pour modifier la disponibilité");
  
      } catch (error) {
        console.error("❌ Erreur lors de la mise à jour :", error);
        alert("Erreur lors de la mise à jour !");
      }
    }
  };
  
  

  getEventStyle = (event) => {
    let backgroundColor;
    console.log("📅 Événement :", event);
    if (event.typeAction === "availability") {
      
      switch (event.type) {
        case "vacances":
          backgroundColor = "#F59E0B"; // 🟠 Orange pour les vacances
          break;
        case "réunion":
          backgroundColor = "#6366F1"; // 🟣 Violet pour les réunions
          break;
        case "maladie":
          backgroundColor = "#E11D48"; // 🔴 Rouge pour les maladies
          break;
        default:
          backgroundColor = "#D1D5DB"; // 🟠 Gris clair
      }
    } else {
      switch (event.status) {
        case "accepté":
          backgroundColor = "#34D399"; // 🟢 Vert
          break;
        case "en attente":
          backgroundColor = "#3B82F6"; // 🔵 Bleu
          break;
        case "refusé":
          backgroundColor = "#EF4444"; // 🔴 Rouge
          break;
        default:
          backgroundColor = "#9CA3AF"; // ⚫ Gris foncé
        }
      }
     
    

    return {
      style: {
        backgroundColor,
        color: "white",
        borderRadius: "5px",
        padding: "5px"
      }
    };
  };

  render() {
    const { isLoading, error, appointments, doctorAvailability, showModal, availabilityType } = this.state;
    const { user } = this.context;

    if (isLoading) return <p className="text-center text-gray-500">Chargement...</p>;
    if (error) return <p className="text-center text-red-500">{error}</p>;

    const events = [
      ...appointments.map((appointment) => ({
        id: appointment.id,
        title: appointment.status,
        start: new Date(appointment.date + "T" + appointment.time),
        end: new Date(appointment.date + "T" + appointment.time),
        status: appointment.status,
        type: "appointment"
      })),
      ...doctorAvailability.map((availability) => ({
        id: availability.id,
        title: availability.title,
        start: availability.start,
        end: availability.end,
        type: availability.type,
        typeAction : "availability"
      }))
    ];
    console.log("📅 Liste complète des événements :", events);

    return (
      <div className="bg-gray-100 min-h-screen flex flex-col items-center p-8">
        <h2 className="text-3xl font-semibold mb-6 text-center text-gray-800">Mes Rendez-Vous</h2>
        <div className="w-full max-w-4xl bg-white shadow-lg rounded-lg p-6">
        <DnDCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            selectable
            resizable
            onEventDrop={this.handleEventResizeOrDrop}
            onEventResize={this.handleEventResizeOrDrop}
            onSelectSlot={this.handleSlotSelect} 
            style={{ height: 500 }}
            eventPropGetter={this.getEventStyle}
            className="rounded-lg shadow-md"
          />
        </div>
        {/* Modale pour modifier la disponibilité après Drag & Drop */}
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold mb-4">Modifier la disponibilité</h3>
              <select
                value={availabilityType}
                onChange={(e) => this.setState({ availabilityType: e.target.value })}
                className="w-full p-2 border rounded"
              >
                <option value="vacances">Vacances</option>
                <option value="réunion">Réunion</option>
                <option value="maladie">Maladie</option>
              </select>
              <button onClick={this.handleAddAvailability} className="mt-4 bg-blue-500 text-white p-2 rounded">
                Modifier
              </button>
            </div>
          </div>
        )}
      </div>
      
    );
  }
}

Appointments.propTypes = {
  navigate: PropTypes.func.isRequired,
};
