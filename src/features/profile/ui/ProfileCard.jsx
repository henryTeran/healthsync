import { useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { 
  Edit3, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  Shield, 
  Award,
  Heart,
  User,
  Stethoscope
} from "lucide-react";

export const ProfileCard = ({ profile, isOwner = false, userType }) => {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  const getStatusColor = (status) => {
    const colors = {
      'active': 'bg-health-100 text-health-700',
      'inactive': 'bg-neutral-100 text-neutral-700',
      'pending': 'bg-yellow-100 text-yellow-700'
    };
    return colors[status?.toLowerCase()] || colors.inactive;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Non spécifiée";
    
    try {
      const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return "Date invalide";
    }
  };

  return (
    <div className="card-medical p-8">
      {/* Header avec photo et informations principales */}
      <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8 mb-8">
        {/* Photo de profil */}
        <div className="relative group">
          <div className="w-32 h-32 rounded-2xl overflow-hidden shadow-medical border-4 border-white">
            <img
              src={!imageError && profile?.photoURL ? profile.photoURL : "/default-avatar.png"}
              alt={`${profile?.firstName} ${profile?.lastName}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              onError={() => setImageError(true)}
            />
          </div>
          {userType === 'doctor' && (
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-medical rounded-xl flex items-center justify-center shadow-medical">
              <Stethoscope className="h-5 w-5 text-white" />
            </div>
          )}
        </div>

        {/* Informations principales */}
        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-neutral-800 mb-2">
                {userType === 'doctor' ? 'Dr. ' : ''}{profile?.firstName} {profile?.lastName}
              </h1>
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(profile?.status)}`}>
                  {profile?.status || 'Actif'}
                </span>
                {profile?.type && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-medical-100 text-medical-700">
                    {profile.type === 'doctor' ? 'Médecin' : 'Patient'}
                  </span>
                )}
              </div>
            </div>
            
            {isOwner && (
              <button
                onClick={() => navigate("/editprofile")}
                className="btn-secondary inline-flex items-center space-x-2 mt-4 md:mt-0"
              >
                <Edit3 className="h-4 w-4" />
                <span>Modifier</span>
              </button>
            )}
          </div>

          {/* Informations spécifiques au médecin */}
          {userType === 'doctor' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {profile?.department && (
                <div className="flex items-center space-x-2">
                  <Award className="h-4 w-4 text-medical-500" />
                  <span className="text-sm text-neutral-600">Département: {profile.department}</span>
                </div>
              )}
              {profile?.designation && (
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-medical-500" />
                  <span className="text-sm text-neutral-600">Fonction: {profile.designation}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Informations détaillées */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Informations personnelles */}
        <div className="space-y-4">
          <h3 className="font-semibold text-neutral-800 flex items-center space-x-2">
            <User className="h-4 w-4 text-medical-500" />
            <span>Informations personnelles</span>
          </h3>
          
          <div className="space-y-3">
            {profile?.age && (
              <div className="flex justify-between">
                <span className="text-neutral-600">Âge:</span>
                <span className="font-medium">{profile.age} ans</span>
              </div>
            )}
            
            {profile?.gender && (
              <div className="flex justify-between">
                <span className="text-neutral-600">Genre:</span>
                <span className="font-medium capitalize">{profile.gender}</span>
              </div>
            )}
            
            {profile?.dateOfBirth && (
              <div className="flex justify-between">
                <span className="text-neutral-600">Naissance:</span>
                <span className="font-medium">{formatDate(profile.dateOfBirth)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Contact */}
        <div className="space-y-4">
          <h3 className="font-semibold text-neutral-800 flex items-center space-x-2">
            <Phone className="h-4 w-4 text-medical-500" />
            <span>Contact</span>
          </h3>
          
          <div className="space-y-3">
            {profile?.email && (
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-neutral-400" />
                <span className="text-sm text-neutral-600">{profile.email}</span>
              </div>
            )}
            
            {profile?.mobileNumber && (
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-neutral-400" />
                <span className="text-sm text-neutral-600">{profile.mobileNumber}</span>
              </div>
            )}
            
            {(profile?.address || profile?.state || profile?.country) && (
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-neutral-400 mt-0.5" />
                <div className="text-sm text-neutral-600">
                  {profile.address && <div>{profile.address}</div>}
                  <div>
                    {profile.postalCode} {profile.state}
                    {profile.country && `, ${profile.country}`}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Informations médicales */}
        <div className="space-y-4">
          <h3 className="font-semibold text-neutral-800 flex items-center space-x-2">
            <Heart className="h-4 w-4 text-medical-500" />
            <span>Informations médicales</span>
          </h3>
          
          <div className="space-y-3">
            {userType === 'patient' && profile?.allergies && (
              <div>
                <span className="text-neutral-600 block mb-1">Allergies:</span>
                <span className="text-sm text-neutral-800 bg-red-50 px-2 py-1 rounded-lg">
                  {profile.allergies}
                </span>
              </div>
            )}
            
            {userType === 'doctor' && (
              <>
                {profile?.medicalLicense && (
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Licence:</span>
                    <span className="font-medium font-mono text-sm">{profile.medicalLicense}</span>
                  </div>
                )}
                
                {profile?.education && (
                  <div>
                    <span className="text-neutral-600 block mb-1">Formation:</span>
                    <span className="text-sm text-neutral-800">{profile.education}</span>
                  </div>
                )}
                
                {profile?.about && (
                  <div>
                    <span className="text-neutral-600 block mb-1">À propos:</span>
                    <p className="text-sm text-neutral-800 leading-relaxed">{profile.about}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

ProfileCard.propTypes = {
  profile: PropTypes.object.isRequired,
  isOwner: PropTypes.bool,
  userType: PropTypes.oneOf(['doctor', 'patient']).isRequired
};