import { useContext, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useNavigate, useParams } from "react-router-dom";
import { Eye, Users } from "lucide-react";
import { AuthContext } from "../../../../contexts/AuthContext";
import { getAuthorizedPatients } from "../..";

export const FollowedTable = ({ onDataLoaded }) => {
  const { user } = useContext(AuthContext);
  const { doctorId: paramDoctorId } = useParams();
  const navigate = useNavigate();

  const doctorId = paramDoctorId || user?.uid;
  const isOwner = doctorId === user?.uid;

  const [authorizedPatients, setAuthorizedPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAuthorizedPatients = async () => {
      if (!doctorId) {
        setError("Aucun médecin identifié.");
        setIsLoading(false);
        onDataLoaded?.([]);
        return;
      }

      try {
        const patients = await getAuthorizedPatients(doctorId);
        setAuthorizedPatients(patients);
        onDataLoaded?.(patients);
        setError("");
      } catch (fetchError) {
        setError(fetchError.message || "Impossible de charger les patients suivis.");
        onDataLoaded?.([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAuthorizedPatients();
  }, [doctorId, onDataLoaded]);

  const rows = useMemo(() => authorizedPatients || [], [authorizedPatients]);

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="h-10 rounded-lg bg-neutral-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="text-center py-10">
        <Users className="h-10 w-10 text-neutral-300 mx-auto mb-2" />
        <p className="text-sm text-neutral-500">Aucun patient suivi pour le moment.</p>
      </div>
    );
  }

  return (
    <div className="rounded-[20px] border border-neutral-100 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto max-h-[430px]">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="sticky top-0 z-10 bg-neutral-50">
            <tr className="text-left text-neutral-600">
              <th className="px-4 py-3 font-semibold">Nom</th>
              <th className="px-4 py-3 font-semibold">Âge</th>
              <th className="px-4 py-3 font-semibold">Sexe</th>
              <th className="px-4 py-3 font-semibold">Dernière consultation</th>
              {isOwner && <th className="px-4 py-3 font-semibold text-right">Action</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((patient, index) => (
              <tr
                key={patient.id}
                className={`transition-colors hover:bg-medical-50 ${index % 2 === 0 ? "bg-white" : "bg-neutral-50/40"}`}
              >
                <td className="px-4 py-3 text-neutral-800 font-medium">
                  {patient.lastName} {patient.firstName}
                </td>
                <td className="px-4 py-3 text-neutral-700">{patient.age || "—"}</td>
                <td className="px-4 py-3 text-neutral-700 capitalize">{patient.gender || "—"}</td>
                <td className="px-4 py-3 text-neutral-700">{patient.lastConsultationDate || "N/A"}</td>
                {isOwner && (
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => navigate(`/patientprofile/${patient.id}`)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-medical-200 text-medical-700 hover:bg-medical-50 active:scale-95 transition"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Voir</span>
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

FollowedTable.propTypes = {
  onDataLoaded: PropTypes.func,
};
