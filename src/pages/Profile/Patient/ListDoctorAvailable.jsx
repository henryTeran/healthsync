import React, { Component } from "react";
import { getAllDoctors } from "../../../services/doctorServices";
import { getAuthorizedDoctors } from "../../../services/patientServices";

import { requestFollow } from "../../../services/followService"; 
import { AuthContext } from "../../../contexts/AuthContext";
import PropTypes from "prop-types";

export class ListDoctorAvailable extends Component {
  constructor() {
    super();
    this.state = {
      user: null,
      isLoading: true,
      error: "",
      doctors: [],
      authorizedDoctors: [], // Médecins autorisés
      formErrors: {},
    };
  }

  static contextType = AuthContext;

  componentDidMount() {
    this.fetchDoctors();
    this.fetchAuthorizedDoctors();
  }

fetchDoctors = async () => {
   try {
     const doctors = await getAllDoctors();
     this.setState({ doctors });
   } catch (error) {
     console.error("Erreur lors de la récupération des médecins :", error);
   }finally{
     this.setState({ isLoading: false });
   }
 };

 fetchAuthorizedDoctors = async () => {
   try {
     const { user } = this.context;
     if (!user) return;
     const authorizedDoctors = await getAuthorizedDoctors(user.uid);
     this.setState({ authorizedDoctors });
   } catch (error) {
     console.error("Erreur lors de la récupération des médecins autorisés :", error);
   }finally{
     this.setState({ isLoading: false });
   }
 };

 handleFollowRequest = async (doctorId) => {
   try {
     const { user } = this.context;
     if (!user) throw new Error("Utilisateur non authentifié.");
     await requestFollow(user.uid, doctorId);
     alert("Demande de suivi envoyée !");
     this.props.navigate("/notifications");
   } catch (error) {
     alert(error.message);
   }
 };
  
 render() {
   const { isLoading, error, doctors, authorizedDoctors } = this.state;

   if (isLoading) return <p className="text-center text-gray-600">Chargement...</p>;
   if (error) return <p className="text-center text-red-500">{error}</p>;

   return (
       <div className="p-4">
       {/* Informations du profil */}
           <div className="bg-white shadow-md rounded-lg p-6 mb-6">
               <div className="flex items-center justify-between">
                   {/* Tableau des médecins disponibles */}
                   <div className="bg-white shadow-md rounded-lg p-6">
                   <h2 className="text-xl font-bold mb-4">Liste des Médecins</h2>
                   <table className="w-full border-collapse">
                       <thead>
                       <tr>
                           <th className="border p-2">Nom</th>
                           <th className="border p-2">Département</th>
                           <th className="border p-2">Statut</th>
                           <th className="border p-2">Action</th>
                       </tr>
                       </thead>
                       <tbody>
                       {doctors.length > 0 ? (
                           doctors.map((doctor) => (
                           <tr key={doctor.id}>
                               <td className="border p-2">{`${doctor.firstName} ${doctor.lastName}`}</td>
                               <td className="border p-2">{doctor.department || "Non spécifié"}</td>
                               <td className="border p-2">
                               {authorizedDoctors.some((authDoctor) => authDoctor.id === doctor.id)
                                   ? "Autorisé"
                                   : "En attente"}
                               </td>
                               <td className="border p-2">
                               <button
                                   onClick={() => this.handleFollowRequest(doctor.id)}
                                   disabled={authorizedDoctors.some((authDoctor) => authDoctor.id === doctor.id)}
                                   className={`px-4 py-2 rounded ${
                                   authorizedDoctors.some((authDoctor) => authDoctor.id === doctor.id)
                                       ? "bg-gray-300 cursor-not-allowed"
                                       : "bg-green-500 text-white hover:bg-green-600"
                                   }`}
                               >
                                   {authorizedDoctors.some((authDoctor) => authDoctor.id === doctor.id)
                                   ? "Suivi en cours"
                                   : "Demander suivi"}
                               </button>
                               </td>
                           </tr>
                           ))
                       ) : (
                           <tr>
                           <td colSpan="4" className="text-center border p-2">
                               Aucun médecin disponible pour le moment.
                           </td>
                           </tr>
                       )}
                       </tbody>
                   </table>
                   </div>
               </div>
           </div>
       </div>
          

   )
 };

}

ListDoctorAvailable.propTypes = {
  navigate: PropTypes.func.isRequired,
};
