import React, { useMemo, useState, useEffect, useContext } from "react";
import PropTypes from "prop-types";
import { useTable, usePagination, useSortBy } from "react-table";
import { useNavigate } from "react-router-dom";
import { addDoc, collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../../providers/firebase";
import { AuthContext } from "../../../contexts/AuthContext";

export const ListePatientsProfiles = () => {
  const [patients, setPatients] = useState([]);
  const [followedPatients, setFollowedPatients] = useState([]);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const isDoctor = user?.userType === "doctor";

  // 🔥 Écoute en temps réel les patients de la collection "users"
  useEffect(() => {
    const q = query(collection(db, "users"), where("type", "==", "patient"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const patientList = snapshot.docs.map((doc) => ({
        id: doc.id, // ✅ Ajout de l'ID Firestore
        ...doc.data(),
        fullName: `${doc.data().firstName} ${doc.data().lastName}`,
      }));
      console.log("👀 Mise à jour en temps réel des patients :", patientList);
      setPatients(patientList);
    });

    return () => unsubscribe(); // Arrêter l'écoute en quittant la page
  }, []);

  // 🔥 Écoute en temps réel les patients suivis par le médecin
  useEffect(() => {
    if (!user || !isDoctor) return;

    const q = query(collection(db, "doctor_patient_links"), where("doctorId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const followedIds = snapshot.docs.map((doc) => doc.data().patientId);
      console.log("👀 Patients suivis mis à jour :", followedIds);
      setFollowedPatients(followedIds);
    });

    return () => unsubscribe();
  }, [user, isDoctor]);

  const handleFollowPatient = async (patientId) => {
    if (!user || !isDoctor) return;

    try {
      await addDoc(collection(db, "doctor_patient_links"), {
        doctorId: user.uid,
        patientId: patientId,
        authorized: true,
        createdAt: new Date(),
      });

      await addDoc(collection(db, "notifications"), {
        userId: patientId,
        type: "follow_response",
        message: `Le Dr. ${user.firstName} ${user.lastName} a accepté votre dossier.`,
        read: false,
        patientId: patientId,
        createdAt: new Date(),
      });

      console.log("✅ Patient suivi !");
    } catch (error) {
      console.error("❌ Erreur :", error);
      alert("❌ Impossible de suivre le patient.");
    }
  };

  const columns = useMemo(
    () => [
      { Header: "Patient", accessor: "fullName" },
      { Header: "Téléphone", accessor: "mobileNumber" },
      { Header: "Email", accessor: "email" },
      { Header: "Ville", accessor: "state" },
      { Header: "Pays", accessor: "country" },
      {
        Header: "Date d'inscription",
        accessor: "signupDate",
        Cell: ({ value }) => (value ? new Date(value).toLocaleDateString() : "Non spécifié"),
      },
      {
        Header: "Action",
        accessor: "actions",
        Cell: ({ row }) => {
          const patientId = row.original.id;
          const isAlreadyFollowed = followedPatients.includes(patientId);

          return (
            <div className="flex space-x-2">
              {patientId ? (
                <button
                  onClick={() => navigate(`/patientprofile/${patientId}`)}
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                >
                  Voir Profil
                </button>
              ) : (
                <span className="text-gray-500">ID introuvable</span>
              )}

              {isDoctor && !isAlreadyFollowed && (
                <button
                  onClick={() => handleFollowPatient(patientId)}
                  className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                >
                  Suivre Patient
                </button>
              )}

              {isDoctor && isAlreadyFollowed && (
                <span className="bg-gray-300 text-gray-700 px-3 py-1 rounded">Déjà suivi</span>
              )}
            </div>
          );
        },
      },
    ],
    [navigate, isDoctor, followedPatients]
  );

  const data = useMemo(() => patients, [patients]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    nextPage,
    previousPage,
    canNextPage,
    canPreviousPage,
    state: { pageIndex },
  } = useTable(
    { columns, data, initialState: { pageIndex: 0, pageSize: 5 } },
    useSortBy,
    usePagination
  );

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-semibold text-gray-700 mb-6">Liste des Patients</h2>

      <table {...getTableProps()} className="min-w-full bg-white border border-gray-200">
        <thead>
          {headerGroups.map((headerGroup, index) => (
            <tr {...headerGroup.getHeaderGroupProps()} key={index} className="border-b bg-gray-100">
              {headerGroup.headers.map((column, colIndex) => (
                <th
                  {...column.getHeaderProps(column.getSortByToggleProps())}
                  key={colIndex}
                  className="px-6 py-3 text-left text-sm font-medium text-gray-500"
                >
                  {column.render("Header")}
                  <span>{column.isSorted ? (column.isSortedDesc ? " ▼" : " ▲") : ""}</span>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {page.map((row, rowIndex) => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()} key={rowIndex} className="border-b">
                {row.cells.map((cell, cellIndex) => (
                  <td {...cell.getCellProps()} key={cellIndex} className="px-6 py-4 text-sm text-gray-500">
                    {cell.render("Cell")}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="flex justify-between mt-4">
        <button onClick={previousPage} disabled={!canPreviousPage} className="bg-gray-300 px-4 py-2 rounded-lg">
          Précédent
        </button>
        <span>Page {pageIndex + 1}</span>
        <button onClick={nextPage} disabled={!canNextPage} className="bg-gray-300 px-4 py-2 rounded-lg">
          Suivant
        </button>
      </div>
    </div>
  );
};

ListePatientsProfiles.propTypes = {
  row: PropTypes.shape({
    original: PropTypes.shape({
      id: PropTypes.string,
    }),
  }),
};
