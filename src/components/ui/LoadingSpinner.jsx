import React from 'react';

export const LoadingSpinner = ({ size = 'md', className = '', variant = 'medical' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const variantClasses = {
    medical: 'border-medical-200 border-t-medical-500',
    health: 'border-health-200 border-t-health-500',
    neutral: 'border-neutral-200 border-t-neutral-500'
  };

  return (
    <div className={`flex flex-col justify-center items-center ${className}`}>
      <div 
        className={`${sizeClasses[size]} border-4 ${variantClasses[variant]} rounded-full animate-spin`}
        role="status"
        aria-label="Chargement en cours"
      >
        <span className="sr-only">Chargement...</span>
      </div>
      {size === 'xl' && (
        <p className="mt-4 text-sm text-neutral-500 animate-pulse-soft">
          Chargement en cours...
        </p>
      )}
    </div>
  );
};