import React from "react";
import PropTypes from "prop-types";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export const StatsCard = ({ 
  title, 
  value, 
  previousValue, 
  icon: Icon, 
  color = 'medical',
  trend,
  subtitle,
  loading = false 
}) => {
  const colorClasses = {
    medical: 'from-medical-500 to-medical-600 border-medical-200',
    health: 'from-health-500 to-health-600 border-health-200',
    warning: 'from-yellow-500 to-yellow-600 border-yellow-200',
    danger: 'from-red-500 to-red-600 border-red-200',
    info: 'from-blue-500 to-blue-600 border-blue-200'
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-health-600" />;
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-neutral-400" />;
  };

  const getTrendText = () => {
    if (!trend) return null;
    const percentage = Math.abs(trend);
    const direction = trend > 0 ? 'augmentation' : 'diminution';
    return `${percentage}% ${direction}`;
  };

  if (loading) {
    return (
      <div className="card-medical p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-neutral-200 rounded w-24"></div>
          <div className="h-8 w-8 bg-neutral-200 rounded-xl"></div>
        </div>
        <div className="h-8 bg-neutral-200 rounded w-16 mb-2"></div>
        <div className="h-3 bg-neutral-200 rounded w-20"></div>
      </div>
    );
  }

  return (
    <div className="card-medical p-6 hover-lift group">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-neutral-600 group-hover:text-neutral-800 transition-colors">
          {title}
        </h3>
        {Icon && (
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center shadow-soft group-hover:shadow-medical transition-all duration-300`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-bold text-neutral-800">{value}</span>
          {trend !== undefined && (
            <div className="flex items-center space-x-1">
              {getTrendIcon()}
              <span className={`text-sm font-medium ${
                trend > 0 ? 'text-health-600' : trend < 0 ? 'text-red-600' : 'text-neutral-400'
              }`}>
                {getTrendText()}
              </span>
            </div>
          )}
        </div>
        
        {subtitle && (
          <p className="text-sm text-neutral-500">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

StatsCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  previousValue: PropTypes.number,
  icon: PropTypes.elementType,
  color: PropTypes.oneOf(['medical', 'health', 'warning', 'danger', 'info']),
  trend: PropTypes.number,
  subtitle: PropTypes.string,
  loading: PropTypes.bool
};