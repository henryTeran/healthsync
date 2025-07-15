import { useState, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, User, Pill, HeartPulse, CalendarCheck, ChevronUp, ChevronDown, MessageSquareText, Accessibility, Stethoscope, Activity } from "lucide-react";
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
        className={`glass-medical backdrop-blur-xl border-r border-medical-100/30 h-screen fixed top-0 left-0 transition-all duration-300 z-40
          ${isCollapsed ? "w-16" : "w-64"} flex flex-col`} 
      >
        {/* Logo */}
        <div className={`p-6 flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} border-b border-medical-100/30`}>
          {isCollapsed ? (
            <div className="w-10 h-10 bg-gradient-medical rounded-xl flex items-center justify-center">
              <Stethoscope className="h-6 w-6 text-white" />
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-medical rounded-xl flex items-center justify-center">
                <Stethoscope className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gradient">HealthSync</h1>
                <p className="text-xs text-medical-500">Plateforme Médicale</p>
              </div>
            </div>
          )}
        </div>

        {/* Menu */}
        <nav className="flex-1 px-4 py-6 space-y-2">
            {routes.map((route, index) => (
              <div key={route.path}>
                {route.subRoutes ? (
                  <>
                    <button
                      onClick={() => handleSubMenuToggle(index)}
                      className={`nav-item w-full ${
                        location.pathname.startsWith(route.path) ? "active" : ""
                      } ${isCollapsed ? 'justify-center px-3' : 'justify-between'}`}
                    >
                      <div className="flex items-center">
                        <span className="nav-icon">{route.icon}</span>
                        {!isCollapsed && <span className="font-medium">{route.label}</span>}
                      </div>
                      {!isCollapsed && (
                        <span className="ml-auto">
                          {openSubMenu === index ? 
                            <ChevronUp className="h-4 w-4" /> : 
                            <ChevronDown className="h-4 w-4" />
                          }
                        </span>
                      )}
                    </button>
                    {openSubMenu === index && !isCollapsed && (
                      <div className="ml-8 mt-2 space-y-1 animate-slide-down">
                        {route.subRoutes.map((subRoute) => (
                          <Link
                            key={subRoute.path}
                            to={subRoute.path}
                            className={`block px-4 py-2 text-sm rounded-lg transition-all duration-200 ${
                              location.pathname === subRoute.path 
                                ? "bg-medical-100 text-medical-700 font-medium" 
                                : "text-neutral-600 hover:bg-medical-50 hover:text-medical-600"
                            }`}
                          >
                            {subRoute.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            ))}
        </nav>

        {/* Footer */}
        {!isCollapsed && (
          <div className="p-4 border-t border-medical-100/30">
            <div className="flex items-center space-x-3 text-xs text-neutral-500">
              <Activity className="h-4 w-4 text-health-500" />
              <span>Système opérationnel</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

Sidebar.propTypes = {
  isCollapsed: PropTypes.bool.isRequired,
};
