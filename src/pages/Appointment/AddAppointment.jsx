// src/pages/AddAppointment.jsx
import React, { Component } from "react";
import { createAppointment } from "../../services/appointmentService";
import { getUserProfile } from "../../services/profileService";
import { getAuthorizedDoctors } from "../../services/patientServices";
import { addNotification } from "../../services/notificationService"; 
import { AuthContext } from "../../contexts/AuthContext";
import PropTypes from "prop-types";

export class AddAppointment extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: null,
      formData: {
        date: "",
        time: "",
        notes: "",
        doctorId : "",
      },
      authorizedDoctors: [],
      isLoading: false,
      error: "",
    };
  }

  static contextType = AuthContext;

  handleInputChange = (e) => {
    const { name, value } = e.target;
    this.setState((prevState) => ({
      formData: { ...prevState.formData, [name]: value },
    }));
  };

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
      console.error("Erreur lors de la récupération des médecins autorisés :", error);
    }
  };

  handleSubmit = async (e) => {
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
        ...this.state.formData, // Date, heure, notes
        createdBy: user.uid, // ID du créateur du RDV
        patientId: user.uid, // ID du patient
        status: "en attente", // Statut initial
      };
      // Créer le rendez-vous dans Firestore
      const appointmentId = await createAppointment(appointmentData);
      // Envoyer une notification au médecin
  
      const notificationData = {
        type: "new_appointment_request",
        message: `Le patient ${profileData.firstName} ${profileData.lastName} souhaite prendre un rendez-vous.`,
        patientId: user.uid,
        appointmentId: appointmentId,
      };

      await addNotification(this.state.formData.doctorId, notificationData); // Envoyer la notification

      alert("Rendez-vous ajouté avec succès ! Le médecin a été notifié.");
      this.props.navigate("/Appointments"); // Redirection vers la page des rendez-vous
    } catch (error) {
      this.setState({ error: error.message });
    } finally {
      this.setState({ isLoading: false });
    }
  };

  render() {
    const { isLoading, error, formData, authorizedDoctors } = this.state;

    if (isLoading) return <p>Chargement...</p>;
    if (error) return <p>{error}</p>;

    return (
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-center">Ajouter un Rendez-Vous</h2>

        <form onSubmit={this.handleSubmit}>
          {/* Sélection du médecin */}
          <div>
            <label htmlFor="doctor" className="block text-sm font-medium text-gray-700">
              Médecin*
            </label>
            <select
              id="doctor"
              name="doctorId"
              value={formData.doctorId}
              onChange={this.handleInputChange}
              required
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            >
              <option value="" disabled>
                -- Sélectionnez un médecin --
              </option>
              {authorizedDoctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.firstName} {doctor.lastName}
                </option>
              ))}
            </select>
          </div>
          
          {/* Date */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700">
              Date*
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={this.handleInputChange}
              required
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Heure */}
          <div className="mt-4">
            <label htmlFor="time" className="block text-sm font-medium text-gray-700">
              Heure*
            </label>
            <input
              type="time"
              id="time"
              name="time"
              value={formData.time}
              onChange={this.handleInputChange}
              required
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Notes */}
          <div className="mt-4">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={this.handleInputChange}
              rows="3"
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Bouton Soumettre */}
          <button
            type="submit"
            onClick={this.handleSubmit}
            className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 mt-6"
          >
            Ajouter RDV
          </button>
        </form>
      </div>
    );
  }
}
AddAppointment.propTypes = {
  navigate: PropTypes.func.isRequired,
};
