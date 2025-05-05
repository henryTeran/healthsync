import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../../../contexts/AuthContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db }  from "../../../providers/firebase";
import { getUserProfile } from "../../../services/profileService";


export const FollowedTable = () => {
  const { user } = useContext(AuthContext);
  const { doctorId: paramDoctorId } = useParams();
  const navigate = useNavigate();

  const doctorId = paramDoctorId || user?.uid;
  const isOwner = doctorId === user?.uid;

  const [authorizedPatients, setAuthorizedPatients] = useState([]);

  useEffect(() => {
    const fetchAuthorizedPatients = () => {
      const patientsQuery = query(
        collection(db, "doctor_patient_links"),
        where("doctorId", "==", doctorId)
      );

      return onSnapshot(patientsQuery, async (snapshot) => {
        const patientIds = snapshot.docs.map((doc) => doc.data().patientId);
        if (patientIds.length > 0) {
          const patientsData = await Promise.all(
            patientIds.map(async (id) => {
              const patientDoc = await getUserProfile(id);
              return patientDoc ? { id, ...patientDoc } : null;
            })
          );
          setAuthorizedPatients(patientsData.filter(Boolean));
        } else {
          setAuthorizedPatients([]);
        }
      });
    };

    const unsubscribe = fetchAuthorizedPatients();
    return () => unsubscribe();
  }, [doctorId]);

  return (
    <>
      <h2 className="text-xl font-semibold mb-2">Patients Suivis</h2>
      <table className="w-full bg-white shadow-md rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-blue-500 text-white">
            <th className="p-3">Nom</th>
            <th className="p-3">Prénom</th>
            <th className="p-3">Âge</th>
            <th className="p-3">Sexe</th>
            <th className="p-3">Dernière Consultation</th>
            {isOwner && <th className="p-3">Action</th>}
          </tr>
        </thead>
        <tbody>
          {authorizedPatients.map((patient) => (
            <tr key={patient.id} className="border-b hover:bg-gray-100">
              <td className="p-3">{patient.lastName}</td>
              <td className="p-3">{patient.firstName}</td>
              <td className="p-3">{patient.age}</td>
              <td className="p-3">{patient.gender}</td>
              <td className="p-3">{patient.lastConsultationDate || "N/A"}</td>
              {isOwner && (
                <td className="p-3">
                  <button
                    onClick={() => navigate(`/patientprofile/${patient.id}`)}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Voir Profil
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};
