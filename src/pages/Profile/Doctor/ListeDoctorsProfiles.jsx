import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { onSnapshot, collection, query, where } from "firebase/firestore";
import { db } from "../../../providers/firebase";
import { requestFollow } from "../../../services/followService";
import { AuthContext } from "../../../contexts/AuthContext";

export const ListeDoctorsProfiles = () => {
  const { user } = useContext(AuthContext);
  const { userId} = useParams(); // 🔥 Récupération des IDs selon la page
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    // 🔥 Écoute en temps réel des médecins
    const q = query(collection(db, "users"), where("type", "==", "doctor"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const doctorsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setDoctors(doctorsData);
    });

    return () => unsubscribe();
  }, []);

  const handleFollowRequest = async (doctorId) => {
    try {
      if (!user) throw new Error("Utilisateur non authentifié.");
      await requestFollow(user.uid, doctorId);
      alert("Demande de suivi envoyée !");
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-semibold text-gray-700 mb-6">Liste des Médecins</h2>
      <table className="w-full border border-gray-300">
        <thead className="bg-gray-200">
          <tr>
            <th className="p-2 border">Nom</th>
            <th className="p-2 border">Spécialisation</th>
            <th className="p-2 border">Téléphone</th>
            <th className="p-2 border">Action</th>
          </tr>
        </thead>
        <tbody>
          {doctors.length > 0 ? (
            doctors.map((doctor) => (
              <tr key={doctor.id} className="border-b">
                <td className="p-2 border">{`${doctor.firstName} ${doctor.lastName}`}</td>
                <td className="p-2 border">{doctor.department || "Non spécifié"}</td>
                <td className="p-2 border">{doctor.mobileNumber || "Non spécifié"}</td>
                <td className="p-2 border flex gap-2">
                  <button
                    onClick={() => navigate(`/doctorprofile/${doctor.id}`)}
                    className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
                  >
                    Voir Profil
                  </button>

                  {/* 🔥 Si un patient est connecté, afficher "Demander Suivi" */}
                  {user?.userType === "patient" && (
                    <button
                      onClick={() => handleFollowRequest(doctor.id)}
                      className="bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600"
                    >
                      Demander Suivi
                    </button>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="text-center p-4">Aucun médecin trouvé.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
