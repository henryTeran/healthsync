import React from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { Plus, Calendar, MessageSquare, FileText, Users, Activity } from "lucide-react";

export const QuickActions = ({ userType }) => {
  const navigate = useNavigate();

  const doctorActions = [
    {
      title: "Nouvelle Prescription",
      description: "Créer une ordonnance",
      icon: FileText,
      color: "medical",
      path: "/medications",
      shortcut: "Ctrl+P"
    },
    {
      title: "Voir Patients",
      description: "Gérer les patients",
      icon: Users,
      color: "health",
      path: "/listepatientsprofiles",
      shortcut: "Ctrl+U"
    },
    {
      title: "Planning",
      description: "Gérer les RDV",
      icon: Calendar,
      color: "info",
      path: "/appointments",
      shortcut: "Ctrl+A"
    },
    {
      title: "Messages",
      description: "Chat avec patients",
      icon: MessageSquare,
      color: "warning",
      path: "/chat",
      shortcut: "Ctrl+M"
    }
  ];

  const patientActions = [
    {
      title: "Nouveau RDV",
      description: "Prendre rendez-vous",
      icon: Calendar,
      color: "medical",
      path: "/addappointment",
      shortcut: "Ctrl+R"
    },
    {
      title: "Mes Symptômes",
      description: "Enregistrer symptômes",
      icon: Activity,
      color: "health",
      path: "/symptoms",
      shortcut: "Ctrl+S"
    },
    {
      title: "Mes Médicaments",
      description: "Gérer les traitements",
      icon: FileText,
      color: "info",
      path: "/medications/prescription",
      shortcut: "Ctrl+M"
    },
    {
      title: "Messages",
      description: "Chat avec médecins",
      icon: MessageSquare,
      color: "warning",
      path: "/chat",
      shortcut: "Ctrl+C"
    }
  ];

  const actions = userType === "doctor" ? doctorActions : patientActions;

  const colorClasses = {
    medical: 'from-medical-500 to-medical-600 hover:from-medical-600 hover:to-medical-700',
    health: 'from-health-500 to-health-600 hover:from-health-600 hover:to-health-700',
    info: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
    warning: 'from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700'
  };

  return (
    <div className="card-medical p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-neutral-800">Actions Rapides</h2>
        <Plus className="h-5 w-5 text-medical-500" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => navigate(action.path)}
            className="group relative p-4 bg-white rounded-xl border border-neutral-200 hover:border-medical-300 transition-all duration-300 hover-lift focus-ring text-left"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorClasses[action.color]} flex items-center justify-center shadow-soft group-hover:shadow-medical transition-all duration-300`}>
                <action.icon className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-neutral-800 group-hover:text-medical-700 transition-colors">
                  {action.title}
                </h3>
              </div>
            </div>
            
            <p className="text-sm text-neutral-600 mb-3">{action.description}</p>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-400 font-mono">{action.shortcut}</span>
              <div className="w-6 h-6 rounded-full bg-neutral-100 group-hover:bg-medical-100 flex items-center justify-center transition-colors">
                <Plus className="h-3 w-3 text-neutral-400 group-hover:text-medical-500 transition-colors" />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

QuickActions.propTypes = {
  userType: PropTypes.oneOf(['doctor', 'patient']).isRequired
};