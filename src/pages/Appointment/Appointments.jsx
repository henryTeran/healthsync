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
import { markNotificationAsRead, addNotification } from "../../services/notificationService";
import { AuthContext } from "../../contexts/AuthContext";
import PropTypes from "prop-types";
import "moment/locale/fr";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import { updateDoc, doc, query, collection, where, onSnapshot } from "firebase/firestore";
import { db } from "../../providers/firebase";
import { Calendar as CalendarIcon, Clock, User, MapPin, Phone, Mail, Edit3, Trash2, Plus, Filter, Search, FileText, Bell, Info, AlertCircle } from "lucide-react";

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
      showAppointmentModal: false,
      selectedSlot: null,
      selectedAppointment: null,
      selectedAvailability: null,
      showAvailabilityModal: false,
      editMode: false,
      editAvailabilityMode: false,
      availabilityType: "vacances",
      view: "month",
      searchTerm: "",
      filterStatus: "all",
      appointmentForm: {
        patientName: "",
        patientEmail: "",
        patientPhone: "",
        reason: "",
        notes: "",
        reminderTime: 24 // heures avant le RDV
      },
      appointmentForm: {
        date: "",
        time: "",
        notes: "",
        reason: "",
        urgency: "normal"
      },
      availabilityForm: {
        type: "vacances",
        startDate: "",
        startTime: "",
        endDate: "",
        endTime: "",
        notes: ""
      }
    };
  }

  static contextType = AuthContext;

  componentDidMount() {
    this.fetchAppointments();
    this.fetchDoctorAvailability();
    this.checkNotification();
    this.setupRealtimeAppointments();
  }

  setupRealtimeAppointments = () => {
    const { user } = this.context;
    if (!user) return;

    // Écoute en temps réel des rendez-vous
    const appointmentsQuery = query(
      collection(db, "appointments"),
      where(user.userType === "doctor" ? "doctorId" : "patientId", "==", user.uid)
    );

    this.unsubscribeAppointments = onSnapshot(appointmentsQuery, async (snapshot) => {
      const appointments = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const appointment = { id: docSnap.id, ...docSnap.data() };
          
          // Enrichir avec les informations de contact
          let contactInfo = {};
          if (user.userType === "doctor" && appointment.patientId) {
            contactInfo = await getUserProfile(appointment.patientId);
          } else if (user.userType === "patient" && appointment.doctorId) {
            contactInfo = await getUserProfile(appointment.doctorId);
          }
          
          return { ...appointment, contactInfo };
        })
      );
      
      this.setState({ appointments });
    });
  };

  componentWillUnmount() {
    if (this.unsubscribeAppointments) {
      this.unsubscribeAppointments();
    }
  }

  getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  fetchAppointments = async () => {
    try {
      const { user } = this.context;
      if (!user) {
        this.setState({ error: "Utilisateur non connecté.", isLoading: false });
        return;
      }
      const profileData = await getUserProfile(user.uid);
      const appointments = await getAppointmentsByUser(user.uid, profileData.type);
      
      // Enrichir les données des rendez-vous avec les informations des patients/médecins
      const enrichedAppointments = await Promise.all(
        appointments.map(async (appointment) => {
          let contactInfo = {};
          if (profileData.type === "doctor" && appointment.patientId) {
            contactInfo = await getUserProfile(appointment.patientId);
          } else if (profileData.type === "patient" && appointment.doctorId) {
            contactInfo = await getUserProfile(appointment.doctorId);
          }
          return { ...appointment, contactInfo };
        })
      );

      this.setState({ isLoading: false, user, appointments: enrichedAppointments });
    } catch (error) {
      this.setState({ error: error.message, isLoading: false });
    }
  };

  fetchDoctorAvailability = async () => {
    try {
      const { user } = this.context;
      if (!user) return;
  
      const availabilities = await getDoctorAvailability(user.uid);
      const formattedAvailabilities = availabilities.map(av => ({
        ...av,
        start: av.start.toDate ? av.start.toDate() : new Date(av.start),
        end: av.end.toDate ? av.end.toDate() : new Date(av.end)
      }));
  
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
    this.setState({ 
      showModal: true, 
      selectedSlot: { start, end },
      availabilityType: "vacances"
    });
  };

  handleEventSelect = (event) => {
    if (event.typeAction === "availability") {
      this.setState({
        selectedAvailability: event,
        showAvailabilityModal: true,
        availabilityForm: {
          type: event.type,
          startDate: moment(event.start).format('YYYY-MM-DD'),
          startTime: moment(event.start).format('HH:mm'),
          endDate: moment(event.end).format('YYYY-MM-DD'),
          endTime: moment(event.end).format('HH:mm'),
          notes: event.resource?.notes || ''
        }
      });
    } else if (event.type === "appointment") {
      this.setState({
        selectedAppointment: event,
        showAppointmentModal: true,
        appointmentForm: {
          date: moment(event.start).format('YYYY-MM-DD'),
          time: moment(event.start).format('HH:mm'),
          notes: event.resource?.notes || '',
          reason: event.resource?.reason || '',
          urgency: event.resource?.urgency || 'normal'
        }
      });
    }
  };

  handleEventDrop = async ({ event, start, end }) => {
    const { user } = this.context;
    
    if (event.typeAction === "availability" && user?.userType === "doctor") {
      try {
        await updateDoc(doc(db, "availabilities", event.id), {
          start: start,
          end: end
        });
        this.fetchDoctorAvailability();
      } catch (error) {
        console.error("Erreur lors du déplacement de l'indisponibilité :", error);
      }
    } else if (event.type === "appointment") {
      try {
        const newDate = moment(start).format('YYYY-MM-DD');
        const newTime = moment(start).format('HH:mm');
        
        await this.handleUpdateAppointment(event.id, {
          date: newDate,
          time: newTime
        });
      } catch (error) {
        console.error("Erreur lors du déplacement du rendez-vous :", error);
      }
    }
  };

  handleAddAvailability = async () => {
    const { user } = this.context;
    const { availabilityForm } = this.state;

    if (!user || user.userType !== "doctor") return;

    try {
      const startDateTime = new Date(`${availabilityForm.startDate}T${availabilityForm.startTime}`);
      const endDateTime = new Date(`${availabilityForm.endDate}T${availabilityForm.endTime}`);
      
      await addDoctorAvailability(user.uid, startDateTime, endDateTime, availabilityForm.type, availabilityForm.notes);
      this.setState({ showModal: false, selectedSlot: null, availabilityForm: {
        type: "vacances",
        startDate: "",
        startTime: "",
        endDate: "",
        endTime: "",
        notes: ""
      }});
      this.fetchDoctorAvailability();
    } catch (error) {
      console.error("Erreur lors de l'ajout de la disponibilité :", error);
    }
  };

  handleUpdateAvailability = async () => {
    const { selectedAvailability, availabilityForm } = this.state;
    if (!selectedAvailability) return;

    try {
      const startDateTime = new Date(`${availabilityForm.startDate}T${availabilityForm.startTime}`);
      const endDateTime = new Date(`${availabilityForm.endDate}T${availabilityForm.endTime}`);
      
      await updateDoc(doc(db, "availabilities", selectedAvailability.id), {
        type: availabilityForm.type,
        start: startDateTime,
        end: endDateTime,
        notes: availabilityForm.notes
      });
      
      this.setState({ showAvailabilityModal: false, editAvailabilityMode: false });
      this.fetchDoctorAvailability();
    } catch (error) {
      console.error("Erreur lors de la modification de l'indisponibilité :", error);
    }
  };

  handleDeleteAvailability = async (availabilityId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette indisponibilité ?")) return;

    try {
      await deleteDoctorAvailability(availabilityId);
      this.setState({ showAvailabilityModal: false });
      this.fetchDoctorAvailability();
    } catch (error) {
      console.error("Erreur lors de la suppression :", error);
    }
  };

  handleAvailabilityFormChange = (field, value) => {
    this.setState(prevState => ({
      availabilityForm: {
        ...prevState.availabilityForm,
        [field]: value
      }
    }));
  };

  handleDeleteAppointment = async (appointmentId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir annuler ce rendez-vous ?")) return;

    try {
      const appointment = this.state.appointments.find(apt => apt.id === appointmentId);
      
      // Notifier le patient/médecin de l'annulation
      const { user } = this.context;
      const contactId = user.userType === "doctor" ? appointment.patientId : appointment.doctorId;
      const contactInfo = appointment.contactInfo;
      
      await addNotification(contactId, {
        type: "appointment_cancelled",
        message: `Votre rendez-vous du ${moment(appointment.date).format('DD/MM/YYYY')} à ${appointment.time} a été annulé.`,
        appointmentId: appointmentId,
        read: false
      });

      await deleteAppointment(appointmentId);
      this.fetchAppointments();
      this.setState({ showAppointmentModal: false });
    } catch (error) {
      console.error("Erreur lors de l'annulation :", error);
    }
  };

  handleUpdateAppointmentForm = (field, value) => {
    this.setState(prevState => ({
      appointmentForm: {
        ...prevState.appointmentForm,
        [field]: value
      }
    }));
  };

  handleSaveAppointmentChanges = async () => {
    const { selectedAppointment, appointmentForm } = this.state;
    if (!selectedAppointment) return;

    try {
      const updates = {
        date: appointmentForm.date,
        time: appointmentForm.time,
        notes: appointmentForm.notes,
        reason: appointmentForm.reason,
        urgency: appointmentForm.urgency
      };

      await this.handleUpdateAppointment(selectedAppointment.id, updates);
      this.setState({ showAppointmentModal: false });
    } catch (error) {
      console.error("Erreur lors de la modification :", error);
      this.setState({ error: error.message });
    }
  };

  handleUpdateAppointment = async (appointmentId, updates) => {
    try {
      await updateAppointment(appointmentId, updates);
      
      // Notifier le contact du changement
      const appointment = this.state.appointments.find(apt => apt.id === appointmentId);
      const { user } = this.context;
      const contactId = user.userType === "doctor" ? appointment.patientId : appointment.doctorId;
      
      await addNotification(contactId, {
        type: "appointment_updated",
        message: `Votre rendez-vous a été modifié. Nouvelle date: ${moment(updates.date || appointment.date).format('DD/MM/YYYY')} à ${updates.time || appointment.time}`,
        appointmentId: appointmentId,
        read: false
      });

      this.fetchAppointments();
      this.setState({ showAppointmentModal: false });
    } catch (error) {
      console.error("Erreur lors de la modification :", error);
      throw error;
    }
  };

  scheduleReminder = async (appointment) => {
    const reminderTime = new Date(appointment.date + "T" + appointment.time);
    reminderTime.setHours(reminderTime.getHours() - (appointment.reminderTime || 24));
    
    // Programmer le rappel
    await addNotification(appointment.patientId, {
      type: "appointment_reminder",
      message: `Rappel: Vous avez un rendez-vous demain à ${appointment.time}`,
      appointmentId: appointment.id,
      scheduledFor: reminderTime.toISOString(),
      read: false
    });
  };

  getEventStyle = (event) => {
    let backgroundColor, borderColor;
    
    if (event.typeAction === "availability") {
      switch (event.type) {
        case "vacances":
          backgroundColor = "#F59E0B";
          borderColor = "#D97706";
          break;
        case "réunion":
          backgroundColor = "#6366F1";
          borderColor = "#4F46E5";
          break;
        case "maladie":
          backgroundColor = "#E11D48";
          borderColor = "#BE185D";
          break;
        default:
          backgroundColor = "#6B7280";
          borderColor = "#4B5563";
      }
    } else {
      switch (event.status) {
        case "accepté":
          backgroundColor = "#10B981";
          borderColor = "#059669";
          break;
        case "en attente":
          backgroundColor = "#3B82F6";
          borderColor = "#2563EB";
          break;
        case "refusé":
          backgroundColor = "#EF4444";
          borderColor = "#DC2626";
          break;
        default:
          backgroundColor = "#6B7280";
          borderColor = "#4B5563";
      }
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        color: "white",
        borderRadius: "8px",
        border: `2px solid ${borderColor}`,
        fontSize: "12px",
        fontWeight: "500"
      }
    };
  };

  filteredAppointments = () => {
    const { appointments, searchTerm, filterStatus } = this.state;
    
    return appointments.filter(appointment => {
      const matchesSearch = !searchTerm || 
        appointment.contactInfo?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.contactInfo?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.notes?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterStatus === "all" || appointment.status === filterStatus;
      
      return matchesSearch && matchesFilter;
    });
  };

  render() {
    const { 
      isLoading, 
      error, 
      appointments, 
      doctorAvailability, 
      showModal, 
      showAppointmentModal,
      showAvailabilityModal,
      selectedAppointment,
      selectedAvailability,
      availabilityType,
      editAvailabilityMode,
      view,
      searchTerm,
      filterStatus,
      availabilityForm
    } = this.state;
    const { user } = this.context;

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-medical-50 to-health-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-medical-500 mx-auto mb-4"></div>
            <p className="text-medical-600 font-medium">Chargement de votre planning...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
          <div className="card-medical p-8 text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarIcon className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Erreur de chargement</h3>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      );
    }

    const events = [
      ...this.filteredAppointments().map((appointment) => ({
        id: appointment.id,
        title: `${appointment.contactInfo?.firstName || 'Patient'} ${appointment.contactInfo?.lastName || ''}`,
        start: new Date(appointment.date + "T" + appointment.time),
        end: new Date(new Date(appointment.date + "T" + appointment.time).getTime() + 60 * 60 * 1000),
        status: appointment.status,
        type: "appointment",
        resource: appointment
      })),
      ...doctorAvailability.map((availability) => ({
        id: availability.id,
        title: availability.type,
        start: availability.start,
        end: availability.end,
        type: availability.type,
        typeAction: "availability"
      }))
    ];

    return (
      <div className="min-h-screen bg-gradient-to-br from-medical-50 via-white to-health-50">
        {/* Header moderne */}
        <div className="bg-white/80 backdrop-blur-xl border-b border-medical-100/30 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-medical rounded-2xl flex items-center justify-center">
                  <CalendarIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gradient">Planning des Rendez-vous</h1>
                  <p className="text-neutral-600">Gérez vos consultations et disponibilités</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm rounded-xl p-2">
                  <button
                    onClick={() => this.setState({ view: 'month' })}
                    className={`px-4 py-2 rounded-lg transition-all ${view === 'month' ? 'bg-medical-500 text-white' : 'text-medical-600 hover:bg-medical-50'}`}
                  >
                    Mois
                  </button>
                  <button
                    onClick={() => this.setState({ view: 'week' })}
                    className={`px-4 py-2 rounded-lg transition-all ${view === 'week' ? 'bg-medical-500 text-white' : 'text-medical-600 hover:bg-medical-50'}`}
                  >
                    Semaine
                  </button>
                  <button
                    onClick={() => this.setState({ view: 'day' })}
                    className={`px-4 py-2 rounded-lg transition-all ${view === 'day' ? 'bg-medical-500 text-white' : 'text-medical-600 hover:bg-medical-50'}`}
                  >
                    Jour
                  </button>
                </div>
              </div>
            </div>

            {/* Barre de recherche et filtres */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-medical-400" />
                <input
                  type="text"
                  placeholder="Rechercher un patient..."
                  value={searchTerm}
                  onChange={(e) => this.setState({ searchTerm: e.target.value })}
                  className="input pl-12 w-full"
                />
              </div>
              
              <div className="relative">
                <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-medical-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => this.setState({ filterStatus: e.target.value })}
                  className="input pl-12 pr-8"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="en attente">En attente</option>
                  <option value="accepté">Accepté</option>
                  <option value="refusé">Refusé</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-3 h-3 bg-health-500 rounded-full"></div>
                  <span className="text-neutral-600">Accepté</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-3 h-3 bg-medical-500 rounded-full"></div>
                  <span className="text-neutral-600">En attente</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-neutral-600">Refusé</span>
                </div>
                {user?.userType === "doctor" && (
                  <>
                    <div className="w-px h-4 bg-neutral-300 mx-2"></div>
                    <div className="flex items-center space-x-2 text-sm">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-neutral-600">Vacances</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span className="text-neutral-600">Réunion</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                      <span className="text-neutral-600">Maladie</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                      <span className="text-neutral-600">Formation</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Instructions pour les médecins */}
        {user?.userType === "doctor" && (
          <div className="max-w-7xl mx-auto px-6 mb-4">
            <div className="bg-gradient-to-r from-medical-50 to-health-50 border border-medical-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <Info className="h-5 w-5 text-medical-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-medical-800 mb-1">Gestion des indisponibilités</h4>
                  <p className="text-sm text-medical-700">
                    • <strong>Cliquez sur une plage horaire</strong> pour ajouter une indisponibilité
                    • <strong>Glissez-déposez</strong> les blocs d'indisponibilité pour les déplacer
                    • <strong>Cliquez sur un bloc</strong> d'indisponibilité pour le modifier ou le supprimer
                    • Les patients verront vos indisponibilités et ne pourront pas prendre de RDV sur ces créneaux
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Calendrier principal */}
        <div className="max-w-7xl mx-auto p-6">
          <div className="card-medical p-6">
            <DnDCalendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              selectable={user?.userType === "doctor"}
              resizable
              onSelectSlot={this.handleSlotSelect}
              onSelectEvent={this.handleEventSelect}
              onEventDrop={this.handleEventDrop}
              onEventResize={this.handleEventDrop}
              view={view}
              onView={(newView) => this.setState({ view: newView })}
              style={{ height: 600 }}
              eventPropGetter={this.getEventStyle}
              messages={messages}
              className="modern-calendar"
            />
          </div>
        </div>

        {/* Modal de disponibilité */}
        {showModal && user?.userType === "doctor" && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="card-medical max-w-md w-full animate-scale-in">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <AlertCircle className="h-6 w-6 text-medical-600" />
                  <h3 className="text-xl font-semibold text-medical-800">Ajouter une indisponibilité</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Type d'indisponibilité</label>
                    <select
                      value={availabilityForm.type}
                      onChange={(e) => this.handleAvailabilityFormChange('type', e.target.value)}
                      className="input w-full"
                    >
                      <option value="vacances">🏖️ Vacances</option>
                      <option value="réunion">👥 Réunion</option>
                      <option value="maladie">🤒 Maladie</option>
                      <option value="formation">📚 Formation</option>
                      <option value="autre">🔧 Autre</option>
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Date de début</label>
                      <input
                        type="date"
                        value={availabilityForm.startDate}
                        onChange={(e) => this.handleAvailabilityFormChange('startDate', e.target.value)}
                        className="input w-full"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Heure de début</label>
                      <input
                        type="time"
                        value={availabilityForm.startTime}
                        onChange={(e) => this.handleAvailabilityFormChange('startTime', e.target.value)}
                        className="input w-full"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Date de fin</label>
                      <input
                        type="date"
                        value={availabilityForm.endDate}
                        onChange={(e) => this.handleAvailabilityFormChange('endDate', e.target.value)}
                        className="input w-full"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Heure de fin</label>
                      <input
                        type="time"
                        value={availabilityForm.endTime}
                        onChange={(e) => this.handleAvailabilityFormChange('endTime', e.target.value)}
                        className="input w-full"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Notes (optionnel)</label>
                    <textarea
                      value={availabilityForm.notes}
                      onChange={(e) => this.handleAvailabilityFormChange('notes', e.target.value)}
                      className="input w-full resize-none"
                      rows="3"
                      placeholder="Détails supplémentaires..."
                    />
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={this.handleAddAvailability}
                      className="btn-primary flex-1"
                    >
                      Confirmer
                    </button>
                    <button
                      onClick={() => this.setState({ showModal: false })}
                      className="btn-secondary flex-1"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de détail d'indisponibilité */}
        {showAvailabilityModal && selectedAvailability && user?.userType === "doctor" && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="card-medical max-w-lg w-full animate-scale-in">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-medical-800">Indisponibilité</h3>
                  <div className={`badge ${
                    selectedAvailability.type === 'vacances' ? 'bg-yellow-100 text-yellow-800' :
                    selectedAvailability.type === 'réunion' ? 'bg-purple-100 text-purple-800' :
                    selectedAvailability.type === 'maladie' ? 'bg-red-100 text-red-800' :
                    selectedAvailability.type === 'formation' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedAvailability.type}
                  </div>
                </div>

                {editAvailabilityMode ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Type</label>
                      <select
                        value={availabilityForm.type}
                        onChange={(e) => this.handleAvailabilityFormChange('type', e.target.value)}
                        className="input w-full"
                      >
                        <option value="vacances">🏖️ Vacances</option>
                        <option value="réunion">👥 Réunion</option>
                        <option value="maladie">🤒 Maladie</option>
                        <option value="formation">📚 Formation</option>
                        <option value="autre">🔧 Autre</option>
                      </select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Date de début</label>
                        <input
                          type="date"
                          value={availabilityForm.startDate}
                          onChange={(e) => this.handleAvailabilityFormChange('startDate', e.target.value)}
                          className="input w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Heure de début</label>
                        <input
                          type="time"
                          value={availabilityForm.startTime}
                          onChange={(e) => this.handleAvailabilityFormChange('startTime', e.target.value)}
                          className="input w-full"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Date de fin</label>
                        <input
                          type="date"
                          value={availabilityForm.endDate}
                          onChange={(e) => this.handleAvailabilityFormChange('endDate', e.target.value)}
                          className="input w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Heure de fin</label>
                        <input
                          type="time"
                          value={availabilityForm.endTime}
                          onChange={(e) => this.handleAvailabilityFormChange('endTime', e.target.value)}
                          className="input w-full"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Notes</label>
                      <textarea
                        value={availabilityForm.notes}
                        onChange={(e) => this.handleAvailabilityFormChange('notes', e.target.value)}
                        className="input w-full resize-none"
                        rows="3"
                        placeholder="Détails supplémentaires..."
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <CalendarIcon className="h-5 w-5 text-medical-500" />
                      <div>
                        <p className="text-sm text-neutral-500">Période</p>
                        <p className="font-medium">
                          Du {moment(selectedAvailability.start).format('DD/MM/YYYY à HH:mm')} 
                          au {moment(selectedAvailability.end).format('DD/MM/YYYY à HH:mm')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Clock className="h-5 w-5 text-medical-500" />
                      <div>
                        <p className="text-sm text-neutral-500">Durée</p>
                        <p className="font-medium">
                          {moment.duration(moment(selectedAvailability.end).diff(moment(selectedAvailability.start))).humanize()}
                        </p>
                      </div>
                    </div>
                    
                    {selectedAvailability.resource?.notes && (
                      <div>
                        <p className="text-sm text-neutral-500 mb-1">Notes</p>
                        <p className="text-sm bg-neutral-50 p-3 rounded-lg">{selectedAvailability.resource.notes}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex space-x-3 mt-6">
                  {editAvailabilityMode ? (
                    <>
                      <button
                        onClick={this.handleUpdateAvailability}
                        className="btn-success flex items-center space-x-2"
                      >
                        <span>Sauvegarder</span>
                      </button>
                      <button
                        onClick={() => this.setState({ editAvailabilityMode: false })}
                        className="btn-secondary"
                      >
                        Annuler
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => this.setState({ editAvailabilityMode: true })}
                        className="btn-secondary flex items-center space-x-2"
                      >
                        <Edit3 className="h-4 w-4" />
                        <span>Modifier</span>
                      </button>
                      
                      <button
                        onClick={() => this.handleDeleteAvailability(selectedAvailability.id)}
                        className="btn-danger flex items-center space-x-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Supprimer</span>
                      </button>
                    </>
                  )}
                  
                  <button
                    onClick={() => this.setState({ showAvailabilityModal: false, editAvailabilityMode: false })}
                    className="btn-ghost flex-1"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Modal de détail du rendez-vous */}
        {showAppointmentModal && selectedAppointment && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="card-medical max-w-2xl w-full animate-scale-in">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-medical-800">Détails du rendez-vous</h3>
                  <div className={`badge ${
                    selectedAppointment.status === 'accepté' ? 'badge-success' : 
                    selectedAppointment.status === 'en attente' ? 'badge-info' : 'badge-error'
                  }`}>
                    {selectedAppointment.status}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {this.state.editMode ? (
                    // Mode édition
                    <div className="col-span-2 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-2">Date</label>
                          <input
                            type="date"
                            value={this.state.appointmentForm.date}
                            onChange={(e) => this.handleUpdateAppointmentForm('date', e.target.value)}
                            className="input w-full"
                            min={this.getMinDate()}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-2">Heure</label>
                          <input
                            type="time"
                            value={this.state.appointmentForm.time}
                            onChange={(e) => this.handleUpdateAppointmentForm('time', e.target.value)}
                            className="input w-full"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Motif</label>
                        <select
                          value={this.state.appointmentForm.reason}
                          onChange={(e) => this.handleUpdateAppointmentForm('reason', e.target.value)}
                          className="input w-full"
                        >
                          <option value="consultation">Consultation générale</option>
                          <option value="suivi">Suivi médical</option>
                          <option value="urgence">Consultation d'urgence</option>
                          <option value="controle">Contrôle post-traitement</option>
                          <option value="prevention">Médecine préventive</option>
                          <option value="autre">Autre</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Notes</label>
                        <textarea
                          value={this.state.appointmentForm.notes}
                          onChange={(e) => this.handleUpdateAppointmentForm('notes', e.target.value)}
                          className="input w-full resize-none"
                          rows="3"
                          placeholder="Notes complémentaires..."
                        />
                      </div>
                    </div>
                  ) : (
                    // Mode affichage
                    <>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <User className="h-5 w-5 text-medical-500" />
                          <div>
                            <p className="text-sm text-neutral-500">Patient</p>
                            <p className="font-medium">
                              {selectedAppointment.resource?.contactInfo?.firstName} {selectedAppointment.resource?.contactInfo?.lastName}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <CalendarIcon className="h-5 w-5 text-medical-500" />
                          <div>
                            <p className="text-sm text-neutral-500">Date</p>
                            <p className="font-medium">{moment(selectedAppointment.start).format('DD MMMM YYYY')}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <Clock className="h-5 w-5 text-medical-500" />
                          <div>
                            <p className="text-sm text-neutral-500">Heure</p>
                            <p className="font-medium">{moment(selectedAppointment.start).format('HH:mm')}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-medical-500" />
                          <div>
                            <p className="text-sm text-neutral-500">Motif</p>
                            <p className="font-medium">{selectedAppointment.resource?.reason || 'Non spécifié'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {selectedAppointment.resource?.contactInfo?.email && (
                          <div className="flex items-center space-x-3">
                            <Mail className="h-5 w-5 text-medical-500" />
                            <div>
                              <p className="text-sm text-neutral-500">Email</p>
                              <p className="font-medium">{selectedAppointment.resource.contactInfo.email}</p>
                            </div>
                          </div>
                        )}

                        {selectedAppointment.resource?.contactInfo?.mobileNumber && (
                          <div className="flex items-center space-x-3">
                            <Phone className="h-5 w-5 text-medical-500" />
                            <div>
                              <p className="text-sm text-neutral-500">Téléphone</p>
                              <p className="font-medium">{selectedAppointment.resource.contactInfo.mobileNumber}</p>
                            </div>
                          </div>
                        )}

                        {selectedAppointment.resource?.urgency && (
                          <div className="flex items-center space-x-3">
                            <Bell className="h-5 w-5 text-medical-500" />
                            <div>
                              <p className="text-sm text-neutral-500">Urgence</p>
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                selectedAppointment.resource.urgency === 'tres_urgent' ? 'bg-red-100 text-red-800' :
                                selectedAppointment.resource.urgency === 'urgent' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-health-100 text-health-800'
                              }`}>
                                {selectedAppointment.resource.urgency === 'tres_urgent' ? 'Très urgent' :
                                 selectedAppointment.resource.urgency === 'urgent' ? 'Urgent' : 'Normal'}
                              </span>
                            </div>
                          </div>
                        )}

                        {selectedAppointment.resource?.notes && (
                          <div>
                            <p className="text-sm text-neutral-500 mb-1">Notes</p>
                            <p className="text-sm bg-neutral-50 p-3 rounded-lg">{selectedAppointment.resource.notes}</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div className="flex space-x-3">
                  {this.state.editMode ? (
                    <>
                      <button
                        onClick={this.handleSaveAppointmentChanges}
                        className="btn-success flex items-center space-x-2"
                      >
                        <span>Sauvegarder</span>
                      </button>
                      <button
                        onClick={() => this.setState({ editMode: false })}
                        className="btn-secondary"
                      >
                        Annuler
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => this.setState({ editMode: true })}
                        className="btn-secondary flex items-center space-x-2"
                      >
                        <Edit3 className="h-4 w-4" />
                        <span>Modifier</span>
                      </button>
                      
                      <button
                        onClick={() => this.handleDeleteAppointment(selectedAppointment.id)}
                        className="btn-danger flex items-center space-x-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Annuler</span>
                      </button>
                    </>
                  )}
                  
                  <button
                    onClick={() => this.setState({ showAppointmentModal: false, editMode: false })}
                    className="btn-ghost flex-1"
                  >
                    Fermer
                  </button>
                </div>
              </div>
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