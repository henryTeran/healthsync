import React, { Component } from "react";
import { createAppointment } from "../../../features/appointments";
import { getUserProfile } from "../../../features/profile";
import { getAuthorizedDoctors } from "../../../features/profile";
import { addNotification } from "../../../features/notifications"; 
import { AuthContext } from "../../../contexts/AuthContext";
import PropTypes from "prop-types";
import { Calendar, Clock, User, FileText, Bell, Send, ArrowLeft } from "lucide-react";
import { logError } from "../../../shared/lib/logger";

export class AddAppointment extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: null,
      formData: {
        date: "",
        time: "",
        notes: "",
        doctorId: "",
        reason: "",
        reminderTime: 24, // heures avant le RDV
        urgency: "normal"
      },
      authorizedDoctors: [],
      isLoading: false,
      error: "",
      step: 1,
      maxSteps: 3
    };
  }

  static contextType = AuthContext;

  componentDidMount() {
    this.fetchAuthorizedDoctors();
  }

  fetchAuthorizedDoctors = async () => {
    try {
      const { user } = this.context;
      if (!user) return;

      const profileData = await getUserProfile(user.uid);
      if (profileData.type !== "patient") {
        throw new Error("Seuls les patients peuvent créer des rendez-vous.");
      }

      const doctors = await getAuthorizedDoctors(user.uid);
      this.setState({ authorizedDoctors: doctors });
    } catch (error) {
      logError("Erreur lors de la récupération des médecins autorisés", error, {
        feature: "appointments",
        action: "fetchAuthorizedDoctors",
        userId: this.context?.user?.uid,
      });
      this.setState({ error: error.message });
    }
  };

  handleInputChange = (e) => {
    const { name, value } = e.target;
    this.setState((prevState) => ({
      formData: { ...prevState.formData, [name]: value },
    }));
  };

  validateStep = (step) => {
    const { formData } = this.state;
    
    switch (step) {
      case 1:
        return formData.doctorId && formData.reason;
      case 2:
        return formData.date && formData.time;
      case 3:
        return true; // Étape optionnelle
      default:
        return false;
    }
  };

  nextStep = () => {
    const { step, maxSteps } = this.state;
    if (step < maxSteps && this.validateStep(step)) {
      this.setState({ step: step + 1 });
    }
  };

  prevStep = () => {
    const { step } = this.state;
    if (step > 1) {
      this.setState({ step: step - 1 });
    }
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const { user } = this.context;
      if (!user) {
        this.setState({ error: "Utilisateur non connecté.", isLoading: false });
        return;
      }

      this.setState({ isLoading: true });
      const profileData = await getUserProfile(user.uid);

      if (!profileData || !profileData.type) {
        throw new Error("Profil utilisateur introuvable.");
      }

      if (this.state.formData.doctorId === "") {
        throw new Error("Veuillez sélectionner un médecin.");
      }

      // Préparer les données du rendez-vous
      const appointmentData = {
        ...this.state.formData,
        createdBy: user.uid,
        patientId: user.uid,
        status: "en attente",
        createdAt: new Date().toISOString()
      };

      // Créer le rendez-vous
      const appointmentId = await createAppointment(appointmentData);

      // Envoyer une notification au médecin
      const selectedDoctor = this.state.authorizedDoctors.find(d => d.id === this.state.formData.doctorId);
      const notificationData = {
        type: "new_appointment_request",
        message: `${profileData.firstName} ${profileData.lastName} souhaite prendre un rendez-vous le ${this.state.formData.date} à ${this.state.formData.time}`,
        patientId: user.uid,
        appointmentId: appointmentId,
        urgency: this.state.formData.urgency
      };

      await addNotification(this.state.formData.doctorId, notificationData);

      // Programmer un rappel pour le patient
      if (this.state.formData.reminderTime > 0) {
        const reminderDate = new Date(this.state.formData.date + "T" + this.state.formData.time);
        reminderDate.setHours(reminderDate.getHours() - this.state.formData.reminderTime);
        
        await addNotification(user.uid, {
          type: "appointment_reminder",
          message: `Rappel: Vous avez un rendez-vous avec Dr. ${selectedDoctor?.firstName} ${selectedDoctor?.lastName} dans ${this.state.formData.reminderTime}h`,
          appointmentId: appointmentId,
          scheduledFor: reminderDate.toISOString()
        });
      }

      // Succès
      this.setState({ 
        isLoading: false,
        step: 4 // Étape de confirmation
      });

    } catch (error) {
      logError("Erreur lors de la création de rendez-vous", error, {
        feature: "appointments",
        action: "handleSubmit",
        userId: this.context?.user?.uid,
        doctorId: this.state.formData?.doctorId,
      });
      this.setState({ error: error.message, isLoading: false });
    }
  };

  getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  getMinTime = () => {
    const { formData } = this.state;
    const today = new Date();
    const selectedDate = new Date(formData.date);
    
    if (selectedDate.toDateString() === today.toDateString()) {
      return today.toTimeString().slice(0, 5);
    }
    return "08:00";
  };

  renderStepIndicator = () => {
    const { step, maxSteps } = this.state;
    
    return (
      <div className="flex items-center justify-center mb-8">
        {[...Array(maxSteps)].map((_, index) => (
          <div key={index} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
              index + 1 <= step 
                ? 'bg-gradient-medical text-white shadow-medical' 
                : 'bg-neutral-200 text-neutral-500'
            }`}>
              {index + 1}
            </div>
            {index < maxSteps - 1 && (
              <div className={`w-16 h-1 mx-2 transition-all ${
                index + 1 < step ? 'bg-medical-500' : 'bg-neutral-200'
              }`} />
            )}
          </div>
        ))}
      </div>
    );
  };

  renderStep1 = () => {
    const { formData, authorizedDoctors } = this.state;
    
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <User className="h-12 w-12 text-medical-500 mx-auto mb-3" />
          <h3 className="text-xl font-semibold text-medical-800">Choisir un médecin</h3>
          <p className="text-neutral-600">Sélectionnez le médecin et le motif de consultation</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Médecin *
          </label>
          <select
            name="doctorId"
            value={formData.doctorId}
            onChange={this.handleInputChange}
            required
            className="input w-full"
          >
            <option value="" disabled>-- Sélectionnez un médecin --</option>
            {authorizedDoctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                Dr. {doctor.firstName} {doctor.lastName} - {doctor.department || 'Médecine générale'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Motif de consultation *
          </label>
          <select
            name="reason"
            value={formData.reason}
            onChange={this.handleInputChange}
            required
            className="input w-full"
          >
            <option value="">-- Sélectionnez un motif --</option>
            <option value="consultation">Consultation générale</option>
            <option value="suivi">Suivi médical</option>
            <option value="urgence">Consultation d'urgence</option>
            <option value="controle">Contrôle post-traitement</option>
            <option value="prevention">Médecine préventive</option>
            <option value="autre">Autre</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Niveau d'urgence
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'normal', label: 'Normal', color: 'bg-health-100 text-health-700 border-health-200' },
              { value: 'urgent', label: 'Urgent', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
              { value: 'tres_urgent', label: 'Très urgent', color: 'bg-red-100 text-red-700 border-red-200' }
            ].map((urgency) => (
              <label key={urgency.value} className="cursor-pointer">
                <input
                  type="radio"
                  name="urgency"
                  value={urgency.value}
                  checked={formData.urgency === urgency.value}
                  onChange={this.handleInputChange}
                  className="sr-only"
                />
                <div className={`p-3 rounded-xl border-2 text-center transition-all ${
                  formData.urgency === urgency.value 
                    ? urgency.color 
                    : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:border-medical-200'
                }`}>
                  {urgency.label}
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
    );
  };

  renderStep2 = () => {
    const { formData } = this.state;
    
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <Calendar className="h-12 w-12 text-medical-500 mx-auto mb-3" />
          <h3 className="text-xl font-semibold text-medical-800">Date et heure</h3>
          <p className="text-neutral-600">Choisissez votre créneau préféré</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Date *
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={this.handleInputChange}
              min={this.getMinDate()}
              required
              className="input w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Heure *
            </label>
            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={this.handleInputChange}
              min={this.getMinTime()}
              required
              className="input w-full"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Notes complémentaires
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={this.handleInputChange}
            rows="4"
            placeholder="Décrivez vos symptômes ou toute information utile pour le médecin..."
            className="input w-full resize-none"
          />
        </div>
      </div>
    );
  };

  renderStep3 = () => {
    const { formData } = this.state;
    
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <Bell className="h-12 w-12 text-medical-500 mx-auto mb-3" />
          <h3 className="text-xl font-semibold text-medical-800">Rappels</h3>
          <p className="text-neutral-600">Configurez vos notifications de rappel</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Rappel avant le rendez-vous
          </label>
          <select
            name="reminderTime"
            value={formData.reminderTime}
            onChange={this.handleInputChange}
            className="input w-full"
          >
            <option value={0}>Aucun rappel</option>
            <option value={1}>1 heure avant</option>
            <option value={2}>2 heures avant</option>
            <option value={6}>6 heures avant</option>
            <option value={24}>24 heures avant</option>
            <option value={48}>48 heures avant</option>
          </select>
        </div>

        <div className="bg-medical-50 p-4 rounded-xl">
          <h4 className="font-medium text-medical-800 mb-2">Récapitulatif</h4>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Médecin:</span> {
              this.state.authorizedDoctors.find(d => d.id === formData.doctorId)?.firstName
            } {
              this.state.authorizedDoctors.find(d => d.id === formData.doctorId)?.lastName
            }</p>
            <p><span className="font-medium">Date:</span> {new Date(formData.date).toLocaleDateString('fr-FR')}</p>
            <p><span className="font-medium">Heure:</span> {formData.time}</p>
            <p><span className="font-medium">Motif:</span> {formData.reason}</p>
            {formData.reminderTime > 0 && (
              <p><span className="font-medium">Rappel:</span> {formData.reminderTime}h avant</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  renderSuccess = () => {
    return (
      <div className="text-center space-y-6">
        <div className="w-20 h-20 bg-health-100 rounded-full flex items-center justify-center mx-auto">
          <Send className="h-10 w-10 text-health-600" />
        </div>
        <div>
          <h3 className="text-2xl font-semibold text-health-800 mb-2">Demande envoyée !</h3>
          <p className="text-neutral-600 mb-4">
            Votre demande de rendez-vous a été envoyée au médecin. 
            Vous recevrez une notification dès qu'il aura répondu.
          </p>
          <div className="bg-health-50 p-4 rounded-xl text-left">
            <h4 className="font-medium text-health-800 mb-2">Prochaines étapes :</h4>
            <ul className="text-sm text-health-700 space-y-1">
              <li>• Le médecin recevra votre demande</li>
              <li>• Vous serez notifié de sa réponse</li>
              <li>• Un rappel vous sera envoyé avant le RDV</li>
            </ul>
          </div>
        </div>
        <button
          onClick={() => this.props.navigate("/appointments")}
          className="btn-primary"
        >
          Voir mes rendez-vous
        </button>
      </div>
    );
  };

  render() {
    const { isLoading, error, step, maxSteps } = this.state;

    return (
      <div className="min-h-screen bg-gradient-to-br from-medical-50 via-white to-health-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <button
              onClick={() => this.props.navigate("/appointments")}
              className="btn-ghost mb-4 inline-flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Retour au planning</span>
            </button>
            <h1 className="text-3xl font-bold text-gradient mb-2">Nouveau rendez-vous</h1>
            <p className="text-neutral-600">Prenez rendez-vous avec votre médecin en quelques étapes</p>
          </div>

          {/* Indicateur d'étapes */}
          {step <= maxSteps && this.renderStepIndicator()}

          {/* Contenu principal */}
          <div className="card-medical p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {step === 1 && this.renderStep1()}
            {step === 2 && this.renderStep2()}
            {step === 3 && this.renderStep3()}
            {step === 4 && this.renderSuccess()}

            {/* Navigation */}
            {step <= maxSteps && (
              <div className="flex justify-between mt-8">
                <button
                  onClick={this.prevStep}
                  disabled={step === 1}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Précédent
                </button>

                {step < maxSteps ? (
                  <button
                    onClick={this.nextStep}
                    disabled={!this.validateStep(step)}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Suivant
                  </button>
                ) : (
                  <button
                    onClick={this.handleSubmit}
                    disabled={isLoading}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Envoi...</span>
                      </div>
                    ) : (
                      'Confirmer le rendez-vous'
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

AddAppointment.propTypes = {
  navigate: PropTypes.func.isRequired,
};