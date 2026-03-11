import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Clock, User, FileText, Calendar, MessageSquare, Activity } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { listenRecentActivityUseCase } from "..";

export const RecentActivity = ({ userType }) => {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = listenRecentActivityUseCase(user.uid, (activitiesData) => {
      setActivities(activitiesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const getActivityIcon = (type) => {
    const icons = {
      appointment: Calendar,
      prescription: FileText,
      message: MessageSquare,
      symptom: Activity,
      profile: User
    };
    return icons[type] || Activity;
  };

  const getActivityColor = (type) => {
    const colors = {
      appointment: 'text-medical-500 bg-medical-100',
      prescription: 'text-health-500 bg-health-100',
      message: 'text-blue-500 bg-blue-100',
      symptom: 'text-yellow-500 bg-yellow-100',
      profile: 'text-purple-500 bg-purple-100'
    };
    return colors[type] || 'text-neutral-500 bg-neutral-100';
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return "À l'instant";
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes}min`;
    if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)}h`;
    return `Il y a ${Math.floor(diffInMinutes / 1440)}j`;
  };

  if (loading) {
    return (
      <div className="card-medical p-6">
        <h2 className="text-xl font-semibold text-neutral-800 mb-6">Activité Récente</h2>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 animate-pulse">
              <div className="w-10 h-10 bg-neutral-200 rounded-xl"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
                <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card-medical p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-neutral-800">Activité Récente</h2>
        <Clock className="h-5 w-5 text-medical-500" />
      </div>
      
      {activities.length > 0 ? (
        <div className="space-y-4">
          {activities.map((activity) => {
            const IconComponent = getActivityIcon(activity.type);
            const colorClass = getActivityColor(activity.type);
            
            return (
              <div key={activity.id} className="flex items-center space-x-4 p-3 rounded-xl hover:bg-medical-50 transition-colors duration-200">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
                  <IconComponent className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-neutral-800">{activity.title}</p>
                  <p className="text-sm text-neutral-600">{activity.description}</p>
                </div>
                <span className="text-xs text-neutral-400 font-medium">
                  {formatTimeAgo(activity.createdAt)}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <Activity className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-500">Aucune activité récente</p>
        </div>
      )}
    </div>
  );
};

RecentActivity.propTypes = {
  userType: PropTypes.oneOf(['doctor', 'patient']).isRequired
};