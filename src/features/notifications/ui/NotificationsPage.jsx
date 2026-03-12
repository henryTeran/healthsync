import React, { useCallback, useContext, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useTable } from "react-table";
import { AuthContext } from "../../../contexts/AuthContext";
import {
  deleteNotification,
  getNotificationsByUser,
  markNotificationAsRead,
} from "../../../features/notifications";
import { logError } from "../../../shared/lib/logger";

export const NotificationsPage = ({ title = "Notifications" }) => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const notificationsData = await getNotificationsByUser(user.uid);
      setNotifications(notificationsData);
    } catch (error) {
      logError("Erreur lors de la récupération des notifications", error, {
        feature: "notifications",
        action: "fetchNotifications",
        userId: user?.uid,
      });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = useCallback(async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      fetchNotifications();
    } catch (error) {
      logError("Erreur lors de la mise à jour de la notification", error, {
        feature: "notifications",
        action: "handleMarkAsRead",
        notificationId,
      });
    }
  }, [fetchNotifications]);

  const handleDeleteNotification = useCallback(async (notificationId) => {
    try {
      await deleteNotification(notificationId);
      fetchNotifications();
    } catch (error) {
      logError("Erreur lors de la suppression de la notification", error, {
        feature: "notifications",
        action: "handleDeleteNotification",
        notificationId,
      });
    }
  }, [fetchNotifications]);

  const columns = React.useMemo(
    () => [
      { Header: "Message", accessor: "message" },
      { Header: "Date", accessor: "createdAt" },
      {
        Header: "Statut",
        accessor: "read",
        Cell: ({ value }) => (
          <span
            className={`px-2 py-1 text-xs font-semibold rounded-full ${
              value ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            {value ? "✅ Lu" : "🔴 Non lu"}
          </span>
        ),
      },
      {
        Header: "Action",
        accessor: "id",
        Cell: ({ row }) => (
          <button
            onClick={() => handleMarkAsRead(row.original.id)}
            disabled={row.original.read}
            className={`px-3 py-1 rounded-lg text-white font-semibold ${
              row.original.read
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {row.original.read ? "Déjà lu" : "Marquer comme lu"}
          </button>
        ),
      },
      {
        Header: "Supprimer",
        accessor: "delete",
        Cell: ({ row }) => (
          <button
            onClick={() => handleDeleteNotification(row.original.id)}
            className="px-3 py-1 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600"
          >
            Supprimer
          </button>
        ),
      },
    ],
    [handleDeleteNotification, handleMarkAsRead]
  );

  const tableInstance = useTable({ columns, data: notifications ?? [] });

  if (isLoading) return <p className="text-center text-gray-500">Chargement...</p>;

  return (
    <div className="p-4 bg-white shadow-md rounded-lg">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      {notifications.length === 0 ? (
        <p className="text-gray-500">Aucune notification.</p>
      ) : (
        <table
          {...tableInstance.getTableProps()}
          className="w-full border-collapse border border-gray-200"
        >
          <thead className="bg-gray-100">
            {tableInstance.headerGroups.map((headerGroup) => (
              <tr
                {...headerGroup.getHeaderGroupProps()}
                key={headerGroup.id}
                className="border-b"
              >
                {headerGroup.headers.map((column) => (
                  <th
                    {...column.getHeaderProps()}
                    key={column.id}
                    className="px-4 py-2 text-left font-medium text-gray-700"
                  >
                    {column.render("Header")}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...tableInstance.getTableBodyProps()}>
            {tableInstance.rows.map((row, index) => {
              tableInstance.prepareRow(row);
              return (
                <tr
                  {...row.getRowProps()}
                  key={row.original.id}
                  className={`border-b ${index % 2 === 0 ? "bg-gray-50" : "bg-white"}`}
                >
                  {row.cells.map((cell) => (
                    <td
                      {...cell.getCellProps()}
                      key={cell.column.id}
                      className="px-4 py-2 text-gray-700"
                    >
                      {cell.render("Cell")}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

const RowPropType = PropTypes.shape({
  original: PropTypes.shape({
    id: PropTypes.string.isRequired,
    read: PropTypes.bool.isRequired,
  }).isRequired,
});

const ValuePropType = PropTypes.shape({
  value: PropTypes.bool.isRequired,
});

NotificationsPage.propTypes = {
  title: PropTypes.string,
  row: RowPropType,
  value: ValuePropType,
};

NotificationsPage.defaultProps = {
  title: "Notifications",
};
