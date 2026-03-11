import { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { useAuth } from "../../contexts/AuthContext";
import { Chat } from "../../features/chat/ui/ChatPage";
import { MedicationsPage } from "../../features/medications/ui/MedicationsPage";
import { MedicationsPrescriptionPage } from "../../features/medications/ui/MedicationsPrescriptionPage";
import { PrescriptionHistoryPage } from "../../features/medications/ui/PrescriptionHistoryPage";
import { NotificationsPage } from "../../features/notifications/ui/NotificationsPage";
import { RemindersPage } from "../../features/reminders/ui/RemindersPage";
import { SymptomChart } from "../../features/symptoms/ui/SymptomChartPage";
import { SymptomsPage } from "../../features/symptoms/ui/SymptomsPage";
import { DoctorDashboard } from "../../features/dashboard/ui/DoctorDashboard";
import { PatientDashboard } from "../../features/dashboard/ui/PatientDashboard";
import { DoctorProfile } from "../../features/profile/ui/doctor/DoctorProfile";
import { ListeDoctorsProfiles } from "../../features/profile/ui/doctor/ListeDoctorsProfiles";
import { ListePatientsProfiles } from "../../features/profile/ui/patient/ListePatientsProfiles";
import { PatientProfile } from "../../features/profile/ui/PatientProfile";
import {
  AddAppointmentWrapper,
  AppointmentsWrapper,
  EditProfileWrapper,
} from "../router/WithNavigation";

export const PrivateLayout = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [, setUnreadChatCount] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex h-screen">
      <Sidebar isCollapsed={!sidebarOpen} />

      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-16"} `}>
        <Header
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          isCollapsed={!sidebarOpen}
        />

        <main className="p-4 flex-1 overflow-y-auto">
          <Routes>
            <Route
              path="/"
              element={user?.type !== "patient" ? <DoctorDashboard /> : <PatientDashboard />}
            />
            <Route path="doctorDashboard" element={<DoctorDashboard />} />
            <Route path="patientDashboard" element={<PatientDashboard />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="patientprofile/:userId?" element={<PatientProfile />} />
            <Route path="doctorprofile/:doctorId?" element={<DoctorProfile />} />
            <Route path="editprofile" element={<EditProfileWrapper />} />
            <Route path="listedoctorsprofiles/:doctorId?" element={<ListeDoctorsProfiles />} />
            <Route path="listepatientsprofiles/:patientId?" element={<ListePatientsProfiles />} />
            <Route path="medications" element={<MedicationsPage />} />
            <Route path="medications/prescription/:prescriptionId?" element={<MedicationsPrescriptionPage />} />
            <Route path="prescriptions/history" element={<PrescriptionHistoryPage />} />
            <Route path="symptoms" element={<SymptomsPage />} />
            <Route path="symptoms-analytics" element={<SymptomChart />} />
            <Route path="appointments" element={<AppointmentsWrapper />} />
            <Route path="addappointment" element={<AddAppointmentWrapper />} />
            <Route path="reminders" element={<RemindersPage />} />
            <Route path="chat/:contactId?" element={<Chat setUnreadChatCount={setUnreadChatCount} />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};
