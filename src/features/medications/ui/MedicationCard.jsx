import React, { useState } from "react";
import PropTypes from "prop-types";
import { 
  Pill, 
  Clock, 
  Calendar, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  AlertCircle,
  Info
} from "lucide-react";

export const MedicationCard = ({ 
  medication, 
  onEdit, 
  onDelete, 
  onToggleStatus,
  showActions = true,
  compact = false 
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const getStatusColor = () => {
    if (!medication.startDate || !medication.endDate) return 'bg-neutral-100 text-neutral-700';
    
    const now = new Date();
    const start = new Date(medication.startDate);
    const end = new Date(medication.endDate);
    
    if (now < start) return 'bg-blue-100 text-blue-700'; // À venir
    if (now > end) return 'bg-neutral-100 text-neutral-700'; // Terminé
    return 'bg-health-100 text-health-700'; // En cours
  };

  const getStatusText = () => {
    if (!medication.startDate || !medication.endDate) return 'Non programmé';
    
    const now = new Date();
    const start = new Date(medication.startDate);
    const end = new Date(medication.endDate);
    
    if (now < start) return 'À venir';
    if (now > end) return 'Terminé';
    return 'En cours';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non définie';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getDaysRemaining = () => {
    if (!medication.endDate) return null;
    
    const now = new Date();
    const end = new Date(medication.endDate);
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return null;
    if (diffDays === 0) return "Dernier jour";
    if (diffDays === 1) return "1 jour restant";
    return `${diffDays} jours restants`;
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-neutral-200 hover:border-medical-300 transition-all duration-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-medical-400 to-medical-500 rounded-xl flex items-center justify-center">
            <Pill className="h-5 w-5 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-neutral-800">{medication.name}</h4>
            <p className="text-sm text-neutral-600">{medication.dosage} • {medication.frequency}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
          {showActions && (
            <button
              onClick={() => onEdit?.(medication)}
              className="p-2 text-neutral-400 hover:text-medical-600 transition-colors"
            >
              <Edit3 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="card-medical p-6 hover-lift">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-gradient-to-br from-medical-400 to-medical-500 rounded-2xl flex items-center justify-center shadow-medical">
            <Pill className="h-7 w-7 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-neutral-800">{medication.name}</h3>
            <p className="text-neutral-600">{medication.dosage}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
          {showActions && (
            <div className="flex space-x-1">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="p-2 text-neutral-400 hover:text-medical-600 transition-colors rounded-lg hover:bg-medical-50"
                title="Voir détails"
              >
                <Info className="h-4 w-4" />
              </button>
              <button
                onClick={() => onEdit?.(medication)}
                className="p-2 text-neutral-400 hover:text-medical-600 transition-colors rounded-lg hover:bg-medical-50"
                title="Modifier"
              >
                <Edit3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete?.(medication)}
                className="p-2 text-neutral-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                title="Supprimer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Informations principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="flex items-center space-x-3">
          <Clock className="h-4 w-4 text-medical-500" />
          <div>
            <span className="text-sm text-neutral-600">Fréquence</span>
            <p className="font-medium text-neutral-800">{medication.frequency}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Calendar className="h-4 w-4 text-medical-500" />
          <div>
            <span className="text-sm text-neutral-600">Durée</span>
            <p className="font-medium text-neutral-800">{medication.duration}</p>
          </div>
        </div>
      </div>

      {/* Période de traitement */}
      {(medication.startDate || medication.endDate) && (
        <div className="bg-medical-50 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <span className="text-sm text-medical-600">Début</span>
                <p className="font-medium text-medical-800">{formatDate(medication.startDate)}</p>
              </div>
              <div className="w-8 h-px bg-medical-300"></div>
              <div>
                <span className="text-sm text-medical-600">Fin</span>
                <p className="font-medium text-medical-800">{formatDate(medication.endDate)}</p>
              </div>
            </div>
            
            {getDaysRemaining() && (
              <div className="text-right">
                <span className="text-sm text-medical-600">Restant</span>
                <p className="font-medium text-medical-800">{getDaysRemaining()}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Horaires de prise */}
      {medication.times && medication.times.length > 0 && (
        <div className="mb-4">
          <span className="text-sm text-neutral-600 mb-2 block">Horaires de prise</span>
          <div className="flex flex-wrap gap-2">
            {medication.times.map((time, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-health-100 text-health-700 rounded-lg text-sm font-medium"
              >
                {time}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Détails supplémentaires */}
      {showDetails && (
        <div className="border-t border-neutral-200 pt-4 space-y-3 animate-slide-down">
          {medication.sideEffects && (
            <div>
              <span className="text-sm text-neutral-600 block mb-1">Effets secondaires</span>
              <p className="text-sm text-neutral-800 bg-yellow-50 p-3 rounded-lg">
                {medication.sideEffects}
              </p>
            </div>
          )}
          
          {medication.notes && (
            <div>
              <span className="text-sm text-neutral-600 block mb-1">Notes</span>
              <p className="text-sm text-neutral-800 bg-neutral-50 p-3 rounded-lg">
                {medication.notes}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Actions de prise */}
      {showActions && medication.status === 'active' && (
        <div className="border-t border-neutral-200 pt-4">
          <button
            onClick={() => onToggleStatus?.(medication)}
            className={`w-full btn ${
              medication.takenStatus 
                ? 'bg-health-100 text-health-700 hover:bg-health-200' 
                : 'btn-primary'
            } inline-flex items-center justify-center space-x-2`}
          >
            <CheckCircle className="h-4 w-4" />
            <span>
              {medication.takenStatus ? 'Pris aujourd\'hui' : 'Marquer comme pris'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

MedicationCard.propTypes = {
  medication: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string.isRequired,
    dosage: PropTypes.string.isRequired,
    frequency: PropTypes.string.isRequired,
    duration: PropTypes.string,
    startDate: PropTypes.string,
    endDate: PropTypes.string,
    times: PropTypes.arrayOf(PropTypes.string),
    status: PropTypes.string,
    takenStatus: PropTypes.bool,
    sideEffects: PropTypes.string,
    notes: PropTypes.string
  }).isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onToggleStatus: PropTypes.func,
  showActions: PropTypes.bool,
  compact: PropTypes.bool
};