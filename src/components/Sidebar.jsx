import { useState, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, User, Pill, HeartPulse, CalendarCheck, ChevronUp, ChevronDown, MessageSquareText, Accessibility } from "lucide-react";
import { AuthContext } from "../contexts/AuthContext";

import logo from "../assets/HealthSyncLogo-removebg.png";
import PropTypes from "prop-types";

export const Sidebar = ({ isCollapsed }) => {
  const location = useLocation();
  const [openSubMenu, setOpenSubMenu] = useState(null);
  const { user } = useContext(AuthContext);
  let routes = [];

  if (user.userType === "doctor") {
    routes = [
      { 
        path: "/dashboard", 
        label: "Tableau de Bord", 
        icon: <LayoutDashboard className="h-5 w-5" />, 
        subRoutes: [
          { path: "/doctordashboard", label: "Dashboard du Médecin" },
        ],
      },

      {
        path: "/doctorsprofiles",
        label: "Médecin",
        icon: <User className="h-5 w-5" />,
        subRoutes: [
          { path: "/doctorprofile", label: "Profil" },
          { path: "/editprofile", label: "Modification du Profil" },
          { path: "/listedoctorsprofiles", label: "Liste des Médecins" },
        ],
      },

      {
        path: "/patientsprofiles",
        label: "Patient",
        icon: <Accessibility className="h-5 w-5" />,
        subRoutes: [
          // { path: "/patientprofile", label: "Profil" },
          { path: "/listepatientsprofiles", label: "Liste des Patients" }, // Uniquement pour les médecins
         ],
      },

      { 
        path: "/medications", 
        label: "Médicaments", 
        icon: <Pill className="h-5 w-5" />, 
        subRoutes: [
          { path: "/medications", label: "Création ordonnance" },
          { path: "/prescriptions/history", label: "Planning médicament" },
          ],
      },

      { 
        path: "/SymptomChart", 
        label: "Symptômes", 
        icon: <HeartPulse className="h-5 w-5" />, 
        subRoutes: [
          { path: "/symptoms_analytic", label: "Suivi des symptômes" },
         ], 
      },
      { 
        path: "/appointments", 
        label: "Rendez-vous", 
        icon: <CalendarCheck className="h-5 w-5" />, 
        subRoutes: [
          { path: "/appointments", label: "Planning Médecin" },

        ],
      },

      { 
        path: "/chat", 
        label: "Chats", 
        icon: <MessageSquareText className="h-5 w-5" />, 
        subRoutes: [
          { path: "/chat", label: "Tous les messages" }, 
        ],
      },

    ];
  } else {
    routes = [
      {
        path: "/dashboard",
        label: "Tableau de Bord",
        icon: <LayoutDashboard className="h-5 w-5" />,
        subRoutes: [

          { path: "/patientdashboard", label: "Dashboard du Patient" },
        ]  
      },
  
 
      {
        path: "/patientsprofiles",
        label: "Patient",
        icon: <User className="h-5 w-5" />,
        subRoutes:  [
          { path: "/patientprofile", label: "Profil" },
          { path: "/editprofile", label: "Modification du Profil" },
        ],
      },

      {   
        path: "/medications", 
        label: "Médicaments", 
        icon: <Pill className="h-5 w-5" />, 
        subRoutes: [
          { path: "/medications_", label: "Gestion médicament" },
         // { path: "/creationprescription", label: "Planning médicaments" },
        ],
      },
      { 
        path: "/symptoms", 
        label: "Symptômes", 
        icon: <HeartPulse className="h-5 w-5" />, 
        subRoutes: [
          { path: "/symptoms", label: "Gestion des symptômes" },
          { path: "/symptoms_analytic", label: "Suivi des symptômes" },
         ], 
      },
      { 
        path: "/appointments", 
        label: "Rendez-vous", 
        icon: <CalendarCheck className="h-5 w-5" />, 
        subRoutes: [
          { path: "/appointments", label: "Planning Médecin" },
          { path: "/addappointment", label: "Demande de rendez-vous" },

        ],
      },
      { 
        path: "/chat", 
        label: "Chats", 
        icon: <MessageSquareText className="h-5 w-5" />, 
        subRoutes: [
          { path: "/chat", label: "Tous les messages" }, 
        ],
      },
      { 
        path: "/reminders", 
        label: "Rappels", 
        icon: <MessageSquareText className="h-5 w-5" />, 
        subRoutes: [
          { path: "/reminders", label: "Tous les messages" }, 
        ],
      },
    ];
  }
 

  const handleSubMenuToggle = (index) => {
    setOpenSubMenu(openSubMenu === index ? null : index);
  };


  return (
    <>
      {/* Sidebar */}
      <div
        className={`bg-gradient-to-b from-green-200 to-white-200 shadow-lg h-screen absolute top-0 left-0 transition-all duration-200
          ${isCollapsed ? "w-16 left-0" : "w-64 left-0"} flex flex-col items-left`} 
      >
        {/* Logo */}
        <div className="p-4 flex items-center justify-center">
          <img src={logo} alt="HealthSync Logo" className="w-48 h-15" />
        </div>

        {/* Menu */}
        <nav className="mt-6">
          <ul>
            {routes.map((route, index) => (
              <li key={route.path} className="px-3 py-2">
                {route.subRoutes ? (
                  <>
                    <button
                      onClick={() => handleSubMenuToggle(index)}
                      className={`flex items-center p-3 w-full rounded-lg transition-colors duration-200 
                        ${location.pathname.startsWith(route.path) ? "bg-green-600 text-white" : "hover:bg-green-300"} 
                        text-[var(--font-size)] font-[var(--font-family)]`}
                    >
                      {route.icon}
                      {!isCollapsed && <span className="ml-3">{route.label}</span>}
                      {!isCollapsed && (openSubMenu === index ? <ChevronUp className="ml-auto h-5 w-5" /> : <ChevronDown className="ml-auto h-5 w-5" />)}
                    </button>
                    {openSubMenu === index && !isCollapsed && (
                      <ul className="pl-6 mt-2 space-y-2">
                        {route.subRoutes.map((subRoute) => (
                          <li key={subRoute.path}>
                            <Link
                              to={subRoute.path}
                              className={`block p-3 rounded-lg transition-colors duration-200 
                                ${location.pathname === subRoute.path ? "bg-green-600 text-white" : "hover:bg-green-300"}`}
                            >
                              {subRoute.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : null}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
};

Sidebar.propTypes = {
  isCollapsed: PropTypes.bool.isRequired,
};
