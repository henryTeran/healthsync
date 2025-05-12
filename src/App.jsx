// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useContext, useEffect } from "react";  
import { DoctorDashboard } from "./pages/Dashboard/DoctorDashboard";
import { PatientDashboard } from "./pages/Dashboard/PatientDashboard";
import { EditProfileWrapper, AppointmentsWrapper, AddAppointmentWrapper } from "./pages/WithNavigation";
import { ListeDoctorsProfiles} from "./pages/Profile/Doctor/ListeDoctorsProfiles"
import { ListePatientsProfiles} from "./pages/Profile/Patient/ListePatientsProfiles"
import { PatientProfile } from "./pages/Profile/PatientProfile";
import { DoctorProfile } from "./pages/Profile/Doctor/DoctorProfile";
import { Medications } from "./pages/medications/Medications";
import { Medications_} from "./pages/medications/Medications_"
import { Symptoms } from "./pages/Symtoms/Symptoms";
import { SymptomChart } from "./components/SymptomChart"; 
import { Login } from "./pages/Login/Login";
import { Register } from "./pages/Login/Register";
import { PrivateRoute } from "./components/PrivateRoute";
import { Sidebar } from "./components/Sidebar";  
import { Header } from "./components/Header";  
import { AuthProvider } from "./contexts/AuthProvider";
import { AuthContext } from "./contexts/AuthContext";
import { Notifications } from "./pages/NotificationsHeader/Notifications";
import { Chat } from "./pages/Chat/Chat";
import { requestForFCMToken, messaging } from "./providers/firebase";
import { onMessage } from "firebase/messaging";
import toast, { Toaster } from "react-hot-toast";
import { PrescriptionHistory } from "./pages/medications/PrescriptionHistory";
import { listenForReminders, sendNotification, testCloudFunction } from "./services/notificationService";
import { RemindersPage } from "./pages/Reminders/RemindersPage";


export const App = () => {
  // useEffect(() => {
  //   console.log("App component mounted");
  //   sendNotification("fPdHIG-WMdicQefhAhS_hZ:APA91bH9q83GOzTb0Ae0bJz2iaxAbym0pPWrlHO1MEm1B2ZtkkOSCrSvrGjFpplElVKvf7a216kHA3ekBNpWvqF_aR9P3HrMVtsBHknkV4cVbZeD6kzKklc", "🔔 Test automatique", "Test au chargement de la page !");

  // }, []);
 
  const { user } = useContext(AuthContext);

  useEffect( () => {
    requestForFCMToken();
    onMessage(messaging, (payload ) => {
      console.log(payload);
      toast (payload.notification.body)
    });
    listenForReminders();
  }, [])

  return (
    <AuthProvider>
        <Toaster position="top-right" />
        <BrowserRouter>
          <Routes>
            {/* Routes publiques */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Routes privées */}
            <Route element={<PrivateRoute />}>
              <Route path="*" element={<PrivateLayout user = {user} />} />
            </Route>

            {/* Redirection vers login si aucune route ne correspond */}
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
  );
};

//  Optimisation de PrivateLayout
const PrivateLayout = (user) => {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768); //  Gestion de l'ouverture de la Sidebar
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false); // Masquer le sidebar sur petit écran
      } else {
        setSidebarOpen(true); // Afficher le sidebar sur grand écran
      }
    };
  
    window.addEventListener("resize", handleResize);
    handleResize(); // Appel initial pour initialiser l'état
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  return (
    <div className="flex h-screen">
      {/* Sidebar dynamique */}
      {<Sidebar isCollapsed={!sidebarOpen} />}

      {/* Contenu principal */}
      <div 
        className={`flex-1 transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-16"} `}>
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} isCollapsed={!sidebarOpen} />  

        {/* Contenu des routes privées */}
        <main className="p-4 flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={user.userType !== "patient" ? <DoctorDashboard /> : <PatientDashboard /> }/>
            <Route path="doctorDashboard" element={<DoctorDashboard />} />
            <Route path="patientDashboard" element={<PatientDashboard />} />
            <Route path="notifications" element={<Notifications />} />
            {/* <Route path="profile" element={<ProfileWrapper />} /> */}
            <Route path="patientprofile/:userId?" element={<PatientProfile />} />
            <Route path="doctorprofile/:doctorId?" element={<DoctorProfile/>} />
            <Route path="editprofile" element={<EditProfileWrapper />} />
            <Route path="listedoctorsprofiles/:doctorId?" element={<ListeDoctorsProfiles />} />
            <Route path="listepatientsprofiles/:patientId?" element={<ListePatientsProfiles />} />
            <Route path="medications" element={<Medications />} />
            <Route path="medications_/:prescriptionId?" element={<Medications_ />} />
          
            <Route path="prescriptions/history" element={<PrescriptionHistory />} />
            <Route path="symptoms" element={<Symptoms />} />
            <Route path="symptoms_analytic" element={<SymptomChart />} />
            <Route path="appointments" element={<AppointmentsWrapper />} />
            <Route path="addappointment" element={<AddAppointmentWrapper />} />
            <Route path="reminders" element={<RemindersPage />} />
            {/* <Route path="chat" element={<Chat />} /> */}
            <Route path="chat/:contactId?" element={<Chat  setUnreadChatCount={setUnreadChatCount} />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};
