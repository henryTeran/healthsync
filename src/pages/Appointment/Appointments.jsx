import React, { useState, useEffect, useContext } from "react";
import { createAppointment, getAppointmentsByUser, updateAppointment, deleteAppointment, addDoctorAvailability, getUnavailabilitiesByDoctor, updateUnavailability, deleteUnavailability } from "../../services/appointmentService";
import { getUserProfile } from "../../services/profileService";
import { getAuthorizedDoctors } from "../../services/patientServices";
import { getAuthorizedPatients } from "../../services/doctorServices";
import { addNotification } from "../../services/notificationService"; 
import { AuthContext } from "../../contexts/AuthContext";
import PropTypes from "prop-types";
import { Calendar, Clock, User, FileText, Bell, Send, ArrowLeft, Search, X, Plus, Edit, Trash2, Info, MapPin, Stethoscope, UserCheck } from "lucide-react";
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/fr';
import 'react-big-calendar/lib/css/react-big-calendar.css';

moment.locale('fr');
const localizer = momentLocalizer(moment);

const messages = {
  allDay: 'Toute la journée',
  previous: 'Précédent',
  next: 'Suivant',
  today: "Aujourd'hui",
  month: 'Mois',
  week: 'Semaine',
  day: 'Jour',
  agenda: 'Agenda',
  date: 'Date',
  time: 'Heure',
  event: 'Événement',
  noEventsInRange: 'Aucun événement dans cette période',
  showMore: total => `+ ${total} de plus`
};

export const Appointments = ({ navigate }) => {
  const { user } = useContext(AuthContext);
  const [currentUser, setCurrentUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [unavailabilities, setUnavailabilities] = useState([]);
  const [authorizedContacts, setAuthorizedContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showUnavailabilityModal, setShowUnavailabilityModal] = useState(false);
  const [editingUnavailability, setEditingUnavailability] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [unavailabilityForm, setUnavailabilityForm] = useState({
    type: 'vacances',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    notes: ''
  });

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  useEffect(() => {
    if (currentUser) {
      fetchAppointments();
      fetchAuthorizedContacts();
      fetchUnavailabilities();
    }
  }, [currentUser, selectedContact]);

  useEffect(() => {
    if (searchTerm && authorizedContacts.length > 0) {
      const filtered = authorizedContacts.filter(contact =>
        `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (contact.department && contact.department.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setSearchResults(filtered);
      setShowSearchDropdown(true);
    } else {
      setSearchResults([]);
      setShowSearchDropdown(false);
    }
  }, [searchTerm, authorizedContacts]);

  const fetchUserProfile = async () => {
    try {
      const profileData = await getUserProfile(user.uid);
      setCurrentUser({ ...profileData, uid: user.uid });
    } catch (error) {
      console.error("Erreur lors de la récupération du profil :", error);
      setError(error.message);
    }
  };

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      let appointmentsData = [];

      if (selectedContact) {
        // Afficher les RDV du contact sélectionné
        if (currentUser.type === 'doctor') {
          if (selectedContact.type === 'patient') {
            appointmentsData = await getAppointmentsByUser(selectedContact.id);
          } else {
            appointmentsData = await getAppointmentsByUser(selectedContact.id, 'doctor');
          }
        } else {
          // Patient regardant le calendrier d'un médecin
          appointmentsData = await getAppointmentsByUser(selectedContact.id, 'doctor');
        }
      } else {
        // Afficher ses propres RDV
        if (currentUser.type === 'doctor') {
          appointmentsData = await getAppointmentsByUser(user.uid, 'doctor');
        } else {
          appointmentsData = await getAppointmentsByUser(user.uid, 'patient');
        }
      }

      setAppointments(appointmentsData);
    } catch (error) {
      console.error("Erreur lors de la récupération des rendez-vous :", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUnavailabilities = async () => {
    try {
      let doctorId;
      if (selectedContact?.type === 'doctor') {
        doctorId = selectedContact.id;
      } else if (currentUser?.type === 'doctor') {
        doctorId = user.uid;
      } else {
        // Patient regardant son propre calendrier - pas d'indisponibilités à afficher
        setUnavailabilities([]);
        return;
      }
      
      const unavailabilitiesData = await getUnavailabilitiesByDoctor(doctorId);
      setUnavailabilities(unavailabilitiesData);
    } catch (error) {
      console.error("Erreur lors de la récupération des indisponibilités :", error);
    }
  };

  const fetchAuthorizedContacts = async () => {
    try {
      let contacts = [];
      if (currentUser.type === 'doctor') {
        // Médecin peut voir patients et autres médecins
        const patients = await getAuthorizedPatients(user.uid);
        const doctors = await getAuthorizedDoctors(user.uid);
        contacts = [
          ...patients.map(p => ({ ...p, type: 'patient' })),
          ...doctors.map(d => ({ ...d, type: 'doctor' }))
        ];
      } else {
        // Patient ne peut voir que les médecins
        const doctors = await getAuthorizedDoctors(user.uid);
        contacts = doctors.map(d => ({ ...d, type: 'doctor' }));
      }
      setAuthorizedContacts(contacts);
    } catch (error) {
      console.error("Erreur lors de la récupération des contacts :", error);
    }
  };

  const handleSelectContact = (contact) => {
    setSelectedContact(contact);
    setSearchTerm(`${contact.firstName} ${contact.lastName}`);
    setShowSearchDropdown(false);
  };

  const handleClearSearch = () => {
    setSelectedContact(null);
    setSearchTerm("");
    setShowSearchDropdown(false);
  };

  const handleSelectSlot = ({ start, end }) => {
    if (currentUser?.type !== 'doctor') return;

    const startDate = moment(start).format('YYYY-MM-DD');
    const startTime = moment(start).format('HH:mm');
    const endDate = moment(end).format('YYYY-MM-DD');
    const endTime = moment(end).format('HH:mm');

    setUnavailabilityForm({
      type: 'vacances',
      startDate,
      startTime,
      endDate,
      endTime,
      notes: ''
    });
    setEditingUnavailability(null);
    setShowUnavailabilityModal(true);
  };

  const handleSelectEvent = (event) => {
    if (event.type === 'unavailability') {
      if (currentUser?.type === 'doctor') {
        setEditingUnavailability(event);
        setUnavailabilityForm({
          type: event.unavailabilityType,
          startDate: moment(event.start).format('YYYY-MM-DD'),
          startTime: moment(event.start).format('HH:mm'),
          endDate: moment(event.end).format('YYYY-MM-DD'),
          endTime: moment(event.end).format('HH:mm'),
          notes: event.notes || ''
        });
        setShowUnavailabilityModal(true);
      }
    } else {
      setSelectedEvent(event);
      setShowModal(true);
    }
  };

  const handleEventDrop = async ({ event, start, end }) => {
    if (event.type === 'unavailability' && currentUser?.type === 'doctor') {
      try {
        const updatedUnavailability = {
          ...event,
          start: start.toISOString(),
          end: end.toISOString()
        };
        
        await updateUnavailability(event.id, updatedUnavailability);
        console.log('Indisponibilité déplacée avec succès');
        fetchUnavailabilities();
      } catch (error) {
        console.error('Erreur lors du déplacement :', error);
      }
    }
  };

  const handleEventResize = async ({ event, start, end }) => {
    if (event.type === 'unavailability' && currentUser?.type === 'doctor') {
      try {
        const updatedUnavailability = {
          ...event,
          start: start.toISOString(),
          end: end.toISOString()
        };
        
        await updateUnavailability(event.id, updatedUnavailability);
        console.log('Indisponibilité redimensionnée avec succès');
        fetchUnavailabilities();
      } catch (error) {
        console.error('Erreur lors du redimensionnement :', error);
      }
    }
  };

  const handleUnavailabilitySubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      const startDateTime = new Date(`${unavailabilityForm.startDate}T${unavailabilityForm.startTime}`);
      const endDateTime = new Date(`${unavailabilityForm.endDate}T${unavailabilityForm.endTime}`);
      
      const unavailabilityData = {
        doctorId: user.uid,
        type: unavailabilityForm.type,
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString(),
        notes: unavailabilityForm.notes,
        createdAt: new Date().toISOString()
      };

      if (editingUnavailability) {
        await updateUnavailability(editingUnavailability.id, unavailabilityData);
      } else {
        await addDoctorAvailability(user.uid, unavailabilityData.start, unavailabilityData.end, unavailabilityData.type, unavailabilityData.notes);
      }

      setShowUnavailabilityModal(false);
      setEditingUnavailability(null);
      fetchUnavailabilities();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde :", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUnavailability = async () => {
    if (!editingUnavailability) return;
    
    try {
      await deleteUnavailability(editingUnavailability.id);
      setShowUnavailabilityModal(false);
      setEditingUnavailability(null);
      fetchUnavailabilities();
    } catch (error) {
      console.error("Erreur lors de la suppression :", error);
      setError(error.message);
    }
  };

  const handleUnavailabilityFormChange = (e) => {
    const { name, value } = e.target;
    setUnavailabilityForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getCalendarEvents = () => {
    const appointmentEvents = appointments.map(appointment => ({
      id: appointment.id,
      title: currentUser?.type === 'doctor' 
        ? (appointment.patientName || 'Patient inconnu')
        : (appointment.doctorName || 'Médecin inconnu'),
      start: new Date(appointment.date + 'T' + appointment.time),
      end: new Date(new Date(appointment.date + 'T' + appointment.time).getTime() + 60 * 60 * 1000),
      resource: appointment,
      type: 'appointment'
    }));

    const unavailabilityEvents = unavailabilities.map(unavailability => {
      const typeConfig = {
        vacances: { color: '#f59e0b', icon: '🏖️', label: 'Vacances' },
        reunion: { color: '#8b5cf6', icon: '👥', label: 'Réunion' },
        maladie: { color: '#dc2626', icon: '🤒', label: 'Maladie' },
        formation: { color: '#2563eb', icon: '📚', label: 'Formation' }
      };

      const config = typeConfig[unavailability.type] || typeConfig.vacances;

      return {
        id: unavailability.id,
        title: `${config.icon} ${config.label}`,
        start: new Date(unavailability.start),
        end: new Date(unavailability.end),
        resource: unavailability,
        type: 'unavailability',
        unavailabilityType: unavailability.type,
        notes: unavailability.notes,
        style: {
          backgroundColor: config.color,
          borderColor: config.color,
          color: 'white'
        }
      };
    });

    return [...appointmentEvents, ...unavailabilityEvents];
  };

  const eventStyleGetter = (event) => {
    if (event.type === 'unavailability') {
      return {
        style: {
          backgroundColor: event.style.backgroundColor,
          borderColor: event.style.borderColor,
          color: event.style.color,
          border: 'none',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: '600',
          textShadow: '0 1px 2px rgba(0,0,0,0.3)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }
      };
    }
    
    return {
      style: {
        backgroundColor: '#10b981',
        borderColor: '#059669',
        color: 'white',
        border: 'none',
        borderRadius: '6px'
      }
    };
  };

  const getSearchPlaceholder = () => {
    if (!currentUser) return "Rechercher...";
    
    if (currentUser.type === 'doctor') {
      return "Rechercher un patient ou médecin...";
    } else {
      return "Rechercher un médecin...";
    }
  };

  const renderUnavailabilityLegend = () => {
    if (currentUser?.type !== 'doctor') return null;

    const types = [
      { key: 'vacances', color: '#f59e0b', icon: '🏖️', label: 'Vacances' },
      { key: 'reunion', color: '#8b5cf6', icon: '👥', label: 'Réunion' },
      { key: 'maladie', color: '#dc2626', icon: '🤒', label: 'Maladie' },
      { key: 'formation', color: '#2563eb', icon: '📚', label: 'Formation' }
    ];

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <div className="flex items-center mb-3">
          <Info className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="font-semibold text-blue-800">Gestion des indisponibilités</h3>
        </div>
        
        <div className="text-sm text-blue-700 mb-4 space-y-1">
          <p>• <strong>Cliquez sur une plage horaire</strong> pour ajouter une indisponibilité</p>
          <p>• <strong>Glissez-déposez</strong> les blocs d'indisponibilité pour les déplacer</p>
          <p>• <strong>Cliquez sur un bloc</strong> d'indisponibilité pour le modifier ou le supprimer</p>
          <p>• Les patients verront vos indisponibilités et ne pourront pas prendre de RDV sur ces créneaux</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {types.map(type => (
            <div key={type.key} className="flex items-center space-x-2">
              <div 
                className="w-4 h-4 rounded-full shadow-sm"
                style={{ backgroundColor: type.color }}
              />
              <span className="text-sm font-medium text-gray-700">
                {type.icon} {type.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSearchBar = () => {
    return (
      <div className="relative mb-6">
        <div className="flex items-center space-x-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder={getSearchPlaceholder()}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 pr-10 w-full"
            />
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          {selectedContact && (
            <button
              onClick={handleClearSearch}
              className="btn-secondary whitespace-nowrap"
            >
              Mon calendrier
            </button>
          )}
        </div>

        {/* Dropdown des résultats */}
        {showSearchDropdown && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
            {searchResults.map(contact => (
              <button
                key={contact.id}
                onClick={() => handleSelectContact(contact)}
                className="w-full px-4 py-3 text-left hover:bg-neutral-50 flex items-center space-x-3 border-b border-neutral-100 last:border-b-0"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                  contact.type === 'doctor' ? 'bg-medical-500' : 'bg-health-500'
                }`}>
                  {contact.type === 'doctor' ? (
                    <Stethoscope className="h-4 w-4" />
                  ) : (
                    <UserCheck className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-neutral-800">
                    {contact.type === 'doctor' ? 'Dr. ' : ''}{contact.firstName} {contact.lastName}
                  </div>
                  {contact.department && (
                    <div className="text-sm text-neutral-500">{contact.department}</div>
                  )}
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  contact.type === 'doctor' 
                    ? 'bg-medical-100 text-medical-700' 
                    : 'bg-health-100 text-health-700'
                }`}>
                  {contact.type === 'doctor' ? 'Médecin' : 'Patient'}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderViewIndicator = () => {
    if (!selectedContact) return null;

    return (
      <div className="bg-gradient-to-r from-medical-50 to-health-50 border border-medical-200 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
              selectedContact.type === 'doctor' ? 'bg-medical-500' : 'bg-health-500'
            }`}>
              {selectedContact.type === 'doctor' ? (
                <Stethoscope className="h-5 w-5" />
              ) : (
                <UserCheck className="h-5 w-5" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-medical-800">
                Calendrier de {selectedContact.type === 'doctor' ? 'Dr. ' : ''}{selectedContact.firstName} {selectedContact.lastName}
              </h3>
              {selectedContact.department && (
                <p className="text-sm text-medical-600">{selectedContact.department}</p>
              )}
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            selectedContact.type === 'doctor' 
              ? 'bg-medical-100 text-medical-700' 
              : 'bg-health-100 text-health-700'
          }`}>
            {selectedContact.type === 'doctor' ? 'Médecin' : 'Patient'}
          </div>
        </div>
      </div>
    );
  };

  const renderInstructions = () => {
    if (currentUser?.type === 'doctor') {
      return (
        <div className="text-sm text-neutral-600 mb-4">
          <p>• Recherchez un patient ou médecin pour voir son calendrier</p>
          <p>• Cliquez sur une plage horaire pour créer une indisponibilité</p>
          <p>• Glissez-déposez les indisponibilités pour les modifier</p>
        </div>
      );
    } else {
      return (
        <div className="text-sm text-neutral-600 mb-4">
          <p>• Recherchez un médecin pour voir ses disponibilités</p>
          <p>• Les zones colorées indiquent les indisponibilités du médecin</p>
          <p>• Utilisez le bouton "Nouveau RDV" pour prendre rendez-vous</p>
        </div>
      );
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-medical-50 via-white to-health-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-50 via-white to-health-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gradient mb-2">Planning des rendez-vous</h1>
          <p className="text-neutral-600">Gérez vos rendez-vous et consultations</p>
        </div>

        {/* Barre de recherche */}
        {renderSearchBar()}

        {/* Indicateur de vue */}
        {renderViewIndicator()}

        {/* Instructions */}
        {renderInstructions()}

        {/* Légende des indisponibilités */}
        {renderUnavailabilityLegend()}

        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-3">
            {currentUser.type === 'patient' && (
              <button
                onClick={() => navigate("/appointments/new")}
                className="btn-primary inline-flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Nouveau RDV</span>
              </button>
            )}
          </div>
        </div>

        {/* Erreur */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Calendrier */}
        <div className="card-medical p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-500"></div>
            </div>
          ) : (
            <BigCalendar
              localizer={localizer}
              events={getCalendarEvents()}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 600 }}
              messages={messages}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              onEventDrop={handleEventDrop}
              onEventResize={handleEventResize}
              selectable={currentUser?.type === 'doctor'}
              resizable={currentUser?.type === 'doctor'}
              dragFromOutsideItem={currentUser?.type === 'doctor'}
              eventPropGetter={eventStyleGetter}
              step={30}
              timeslots={2}
              min={new Date(0, 0, 0, 7, 0, 0)}
              max={new Date(0, 0, 0, 22, 0, 0)}
              formats={{
                timeGutterFormat: 'HH:mm',
                eventTimeRangeFormat: ({ start, end }) => 
                  `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`
              }}
            />
          )}
        </div>

        {/* Modal Rendez-vous */}
        {showModal && selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Détails du rendez-vous</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-neutral-400 hover:text-neutral-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-3">
                <p><strong>Titre:</strong> {selectedEvent.title}</p>
                <p><strong>Date:</strong> {moment(selectedEvent.start).format('DD/MM/YYYY')}</p>
                <p><strong>Heure:</strong> {moment(selectedEvent.start).format('HH:mm')} - {moment(selectedEvent.end).format('HH:mm')}</p>
                {selectedEvent.resource?.notes && (
                  <p><strong>Notes:</strong> {selectedEvent.resource.notes}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal Indisponibilité */}
        {showUnavailabilityModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  {editingUnavailability ? 'Modifier' : 'Ajouter'} une indisponibilité
                </h3>
                <button
                  onClick={() => setShowUnavailabilityModal(false)}
                  className="text-neutral-400 hover:text-neutral-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <form onSubmit={handleUnavailabilitySubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Type d'indisponibilité
                  </label>
                  <select
                    name="type"
                    value={unavailabilityForm.type}
                    onChange={handleUnavailabilityFormChange}
                    className="input w-full"
                    required
                  >
                    <option value="vacances">🏖️ Vacances</option>
                    <option value="reunion">👥 Réunion</option>
                    <option value="maladie">🤒 Maladie</option>
                    <option value="formation">📚 Formation</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Date de début
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={unavailabilityForm.startDate}
                      onChange={handleUnavailabilityFormChange}
                      className="input w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Heure de début
                    </label>
                    <input
                      type="time"
                      name="startTime"
                      value={unavailabilityForm.startTime}
                      onChange={handleUnavailabilityFormChange}
                      className="input w-full"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Date de fin
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      value={unavailabilityForm.endDate}
                      onChange={handleUnavailabilityFormChange}
                      min={unavailabilityForm.startDate}
                      className="input w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Heure de fin
                    </label>
                    <input
                      type="time"
                      name="endTime"
                      value={unavailabilityForm.endTime}
                      onChange={handleUnavailabilityFormChange}
                      className="input w-full"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Notes (optionnel)
                  </label>
                  <textarea
                    name="notes"
                    value={unavailabilityForm.notes}
                    onChange={handleUnavailabilityFormChange}
                    rows="3"
                    className="input w-full resize-none"
                    placeholder="Détails supplémentaires..."
                  />
                </div>

                <div className="flex justify-between pt-4">
                  {editingUnavailability && (
                    <button
                      type="button"
                      onClick={handleDeleteUnavailability}
                      className="btn-danger inline-flex items-center space-x-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Supprimer</span>
                    </button>
                  )}
                  
                  <div className="flex space-x-3 ml-auto">
                    <button
                      type="button"
                      onClick={() => setShowUnavailabilityModal(false)}
                      className="btn-secondary"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading || !unavailabilityForm.startDate || !unavailabilityForm.endDate}
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Sauvegarde...' : (editingUnavailability ? 'Modifier' : 'Ajouter')}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

Appointments.propTypes = {
  navigate: PropTypes.func.isRequired,
};