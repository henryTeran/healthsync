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
import { updateDoc, doc } from "firebase/firestore";
import { db } from "../../providers/firebase";
import { Calendar as CalendarIcon, Clock, User, MapPin, Phone, Mail, Edit3, Trash2, Plus, Filter, Search } from "lucide-react";

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
      }
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
    if (event.type === "appointment") {
      this.setState({
        selectedAppointment: event,
        showAppointmentModal: true
      });
    }
  };

  handleAddAvailability = async () => {
    const { user } = this.context;
    const { selectedSlot, availabilityType } = this.state;

    if (!selectedSlot || !user) return;

    try {
      await addDoctorAvailability(user.uid, selectedSlot.start, selectedSlot.end, availabilityType);
      this.setState({ showModal: false, selectedSlot: null });
      this.fetchDoctorAvailability();
    } catch (error) {
      console.error("Erreur lors de l'ajout de la disponibilité :", error);
    }
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
      selectedAppointment,
      availabilityType,
      view,
      searchTerm,
      filterStatus
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
              </div>
            </div>
          </div>
        </div>

        {/* Calendrier principal */}
        <div className="max-w-7xl mx-auto p-6">
          <div className="card-medical p-6">
            <DnDCalendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              selectable
              resizable
              onSelectSlot={this.handleSlotSelect}
              onSelectEvent={this.handleEventSelect}
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
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="card-medical max-w-md w-full animate-scale-in">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-medical-800 mb-4">Ajouter une indisponibilité</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Type d'indisponibilité</label>
                    <select
                      value={availabilityType}
                      onChange={(e) => this.setState({ availabilityType: e.target.value })}
                      className="input w-full"
                    >
                      <option value="vacances">🏖️ Vacances</option>
                      <option value="réunion">👥 Réunion</option>
                      <option value="maladie">🤒 Maladie</option>
                      <option value="formation">📚 Formation</option>
                    </select>
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

        {/* Modal de détail du rendez-vous */}
        {showAppointmentModal && selectedAppointment && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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

                    {selectedAppointment.resource?.notes && (
                      <div>
                        <p className="text-sm text-neutral-500 mb-1">Notes</p>
                        <p className="text-sm bg-neutral-50 p-3 rounded-lg">{selectedAppointment.resource.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      // Logique de modification
                      console.log("Modifier le rendez-vous");
                    }}
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
                  
                  <button
                    onClick={() => this.setState({ showAppointmentModal: false })}
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