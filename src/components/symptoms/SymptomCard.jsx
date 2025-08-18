import React, { useState } from "react";
import PropTypes from "prop-types";
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Edit3, 
  Trash2,
  AlertTriangle,
  Info,
  Clock
} from "lucide-react";

export const SymptomCard = ({ 
  symptom, 
  onEdit, 
  onDelete, 
  showActions = true,
  compact = false 
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const getIntensityColor = (intensity) => {
    if (intensity <= 3) return 'bg-health-100 text-health-700 border-health-200';
    if (intensity <= 6) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    if (intensity <= 8) return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  const getIntensityIcon = (intensity) => {
    if (intensity <= 3) return <TrendingDown className="h-4 w-4" />;
    if (intensity <= 6) return <Activity className="h-4 w-4" />;
    return <TrendingUp className="h-4 w-4" />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date inconnue';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = now - date;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return "Aujourd'hui";
      if (diffDays === 1) return "Hier";
      if (diffDays < 7) return `Il y a ${diffDays} jours`;
      
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    } catch {
      return 'Date invalide';
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    
    try {
      return new Date(dateString).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-neutral-200 hover:border-medical-300 transition-all duration-200">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 ${getIntensityColor(symptom.intensity)}`}>
            {getIntensityIcon(symptom.intensity)}
          </div>
          <div>
            <h4 className="font-semibold text-neutral-800 capitalize">{symptom.symptomName}</h4>
            <p className="text-sm text-neutral-600">Intensité: {symptom.intensity}/10</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className="text-sm text-neutral-500">{formatDate(symptom.date)}</span>
          {showActions && (
            <button
              onClick={() => onEdit?.(symptom)}
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
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 ${getIntensityColor(symptom.intensity)} shadow-soft`}>
            {getIntensityIcon(symptom.intensity)}
          </div>
          <div>
            <h3 className="text-xl font-bold text-neutral-800 capitalize">{symptom.symptomName}</h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-sm text-neutral-600">Intensité:</span>
              <div className="flex items-center space-x-1">
                <span className="font-bold text-lg text-neutral-800">{symptom.intensity}</span>
                <span className="text-sm text-neutral-500">/10</span>
              </div>
            </div>
          </div>
        </div>
        
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
              onClick={() => onEdit?.(symptom)}
              className="p-2 text-neutral-400 hover:text-medical-600 transition-colors rounded-lg hover:bg-medical-50"
              title="Modifier"
            >
              <Edit3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete?.(symptom)}
              className="p-2 text-neutral-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
              title="Supprimer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Informations principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="flex items-center space-x-3">
          <Calendar className="h-4 w-4 text-medical-500" />
          <div>
            <span className="text-sm text-neutral-600">Date</span>
            <p className="font-medium text-neutral-800">{formatDate(symptom.date)}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Clock className="h-4 w-4 text-medical-500" />
          <div>
            <span className="text-sm text-neutral-600">Heure</span>
            <p className="font-medium text-neutral-800">{formatTime(symptom.date)}</p>
          </div>
        </div>
      </div>

      {/* Causes */}
      {symptom.causes && (
        <div className="mb-4">
          <span className="text-sm text-neutral-600 mb-2 block">Causes possibles</span>
          <div className="flex flex-wrap gap-2">
            {Array.isArray(symptom.causes) ? (
              symptom.causes.map((cause, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-medium"
                >
                  {cause}
                </span>
              ))
            ) : (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-medium">
                {symptom.causes}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Barre d'intensité visuelle */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-neutral-600">Niveau d'intensité</span>
          <span className="text-sm font-medium text-neutral-800">{symptom.intensity}/10</span>
        </div>
        <div className="w-full bg-neutral-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
              symptom.intensity <= 3 ? 'bg-health-500' :
              symptom.intensity <= 6 ? 'bg-yellow-500' :
              symptom.intensity <= 8 ? 'bg-orange-500' : 'bg-red-500'
            }`}
            style={{ width: `${(symptom.intensity / 10) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Détails supplémentaires */}
      {showDetails && symptom.notes && (
        <div className="border-t border-neutral-200 pt-4 animate-slide-down">
          <span className="text-sm text-neutral-600 block mb-2">Notes</span>
          <p className="text-sm text-neutral-800 bg-neutral-50 p-3 rounded-lg leading-relaxed">
            {symptom.notes}
          </p>
        </div>
      )}

      {/* Alerte pour intensité élevée */}
      {symptom.intensity >= 8 && (
        <div className="border-t border-neutral-200 pt-4">
          <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-700 font-medium">
              Intensité élevée - Consultez votre médecin si cela persiste
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

SymptomCard.propTypes = {
  symptom: PropTypes.shape({
    id: PropTypes.string,
    symptomName: PropTypes.string.isRequired,
    intensity: PropTypes.number.isRequired,
    date: PropTypes.string.isRequired,
    causes: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.arrayOf(PropTypes.string)
    ]),
    notes: PropTypes.string
  }).isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  showActions: PropTypes.bool,
  compact: PropTypes.bool
};