// src/pages/DoctorProfile.jsx
import React, { Component } from "react";
import { getFollowRequests, handleFollowRequest } from "../../../services/followService";
import { AuthContext } from "../../../contexts/AuthContext";
import PropTypes from "prop-types";

export class FollowRequestsTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      followRequests: [],
      isLoading: true,
      error: "",
    };
  }

  static contextType = AuthContext;

  componentDidMount() {
    this.fetchFollowRequests();
  }

  fetchFollowRequests = async () => {
    try {
      const { user } = this.context;
      if (!user || user.userType !== "doctor") return;
      const requests = await getFollowRequests(user.uid);
      this.setState({ followRequests: requests, isLoading: false });
    } catch (error) {
      console.error("Error fetching follow requests:", error);
      this.setState({ error: error.message, isLoading: false });
    }
  };
  

  handleAcceptRequest = async (patientId) => {
    try {
      await handleFollowRequest(patientId, this.context.user.uid, true);
      alert("Demande acceptée !");
      this.fetchFollowRequests();
    } catch (error) {
      alert(error.message);
    }
  };

  handleRejectRequest = async (patientId) => {
    try {
      await handleFollowRequest(patientId, this.context.user.uid, false);
      alert("Demande refusée !");
      this.fetchFollowRequests();
    } catch (error) {
      alert(error.message);
    }
  };

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
                  <td className="border p-2">{request.firstName}</td>
                  <td className="border p-2">{request.lastName}</td>
                  <td className="border p-2">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </td>
                  <td className="border p-2">{request.authorized ? "Accepté" : "En attente"}</td>
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

FollowRequestsTable.propTypes = {
  navigate: PropTypes.func.isRequired,
};