// src/pages/DoctorProfile.jsx
import React, { Component } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../../providers/firebase";
import { AuthContext } from "../../../contexts/AuthContext";
import { getUserProfile } from "../../../services/profileService";
import { handleFollowRequest } from "../../../services/followService";

export class FollowRequestsTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      followRequests: [],
      isLoading: true,
      error: "",
    };
    this.unsubscribe = null;
  }

  static contextType = AuthContext;

  componentDidMount() {
    const { user } = this.context;
    if (user && user.userType === "doctor") {
      const q = query(
        collection(db, "doctor_patient_links"),
        where("doctorId", "==", user.uid),
        where("authorized", "==", false)
      );

      this.unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          // ⚠️ onSnapshot ne peut pas être async directement → on encapsule
          (async () => {
            const requests = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));

            const requestsWithPatientData = await Promise.all(
              requests.map(async (request) => {
                try {
                  const patientProfile = await getUserProfile(request.patientId);
                  return {
                    ...request,
                    firstName: patientProfile?.firstName || "Inconnu",
                    lastName: patientProfile?.lastName || "Inconnu",
                  };
                } catch (error) {
                  console.error(
                    `Erreur lors de la récupération du profil du patient ${request.patientId} :`,
                    error
                  );
                  return {
                    ...request,
                    firstName: "Erreur",
                    lastName: "Erreur",
                  };
                }
              })
            );

            this.setState({ followRequests: requestsWithPatientData, isLoading: false });
          })();
        },
        (error) => {
          console.error("Erreur lors de l'écoute des demandes :", error);
          this.setState({ error: error.message, isLoading: false });
        }
      );
    }
  }

  componentWillUnmount() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  handleAcceptRequest = async (patientId) => {
    try {
      await handleFollowRequest(patientId, this.context.user.uid, true);
      alert("Demande acceptée !");
      //this.fetchFollowRequests();
    } catch (error) {
      alert(error.message);
    }
  };

  handleRejectRequest = async (patientId) => {
    try {
      await handleFollowRequest(patientId, this.context.user.uid, false);
      alert("Demande refusée !");
      //this.fetchFollowRequests();
    } catch (error) {
      alert(error.message);
    }
  };

  formatFirestoreDate(rawDate) {
    if (!rawDate) return "N/A";
    try {
      let date;
      if (rawDate.toDate) {
        date = rawDate.toDate();
      } else if (typeof rawDate === "number") {
        date = new Date(rawDate);
      } else {
        date = new Date(rawDate);
      }

      if (isNaN(date.getTime())) return "Date invalide";

      return date.toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (e) {
      return "Date invalide";
    }
  }

  render() {
    const { followRequests, isLoading, error } = this.state;

    if (isLoading) return <p>Chargement...</p>;
    if (error) return <p>{error}</p>;

    return (
      <div>
        <h2 className="text-xl font-bold mb-4">Demandes de Suivi</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border p-2">Nom</th>
              <th className="border p-2">Prénom</th>
              <th className="border p-2">Date de la Demande</th>
              <th className="border p-2">Statut</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {followRequests.length > 0 ? (
              followRequests.map((request) => (
                <tr key={request.id}>
                  <td className="border p-2">{request.lastName}</td>
                  <td className="border p-2">{request.firstName}</td>
                  <td className="border p-2">
                    {this.formatFirestoreDate(request.createdAt)}
                  </td>
                  <td className="border p-2">
                    {request.authorized ? "Accepté" : "En attente"}
                  </td>
                  <td className="border p-2">
                    <button
                      onClick={() => this.handleAcceptRequest(request.patientId)}
                      disabled={request.authorized}
                      className={`px-2 py-1 rounded ${
                        request.authorized
                          ? "bg-gray-300 cursor-not-allowed"
                          : "bg-green-500 text-white hover:bg-green-600"
                      }`}
                    >
                      Accepter
                    </button>
                    <button
                      onClick={() => this.handleRejectRequest(request.patientId)}
                      disabled={request.authorized}
                      className={`ml-2 px-2 py-1 rounded ${
                        request.authorized
                          ? "bg-gray-300 cursor-not-allowed"
                          : "bg-red-500 text-white hover:bg-red-600"
                      }`}
                    >
                      Refuser
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center border p-2">
                  Aucune demande de suivi pour le moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }
}
