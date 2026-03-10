import React, { useEffect, useState } from "react";
import { SymptomCard } from "./SymptomCard";
import { useAuth } from "../../../contexts/AuthContext";
import {
  deleteSymptom,
  getSymptomsByUserRealtime,
} from "../../../features/symptoms";
import { SymptomForm } from "./SymptomForm";
import { Activity, TrendingUp, Plus, BarChart3 } from "lucide-react";

export const SymptomsPage = () => {
  const { user } = useAuth();
  const [symptoms, setSymptoms] = useState([]);
  const [groupedSymptoms, setGroupedSymptoms] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [editingSymptom, setEditingSymptom] = useState(null);
  const [viewMode, setViewMode] = useState('grouped'); // 'grouped' ou 'timeline'

  useEffect(() => {
    if (user) {
      const unsubscribe = getSymptomsByUserRealtime(user.uid, (userSymptoms) => {
        setSymptoms(userSymptoms);
        setGroupedSymptoms(groupSymptomsByName(userSymptoms));
      });
      return () => unsubscribe();
    }
  }, [user]);

  const groupSymptomsByName = (symptoms) => {
    return symptoms.reduce((acc, symptom) => {
      const name = symptom.symptomName.toLowerCase();
      if (!acc[name]) {
        acc[name] = [];
      }
      acc[name].push(symptom);
      return acc;
    }, {});
  };

  const handleEditSymptom = (symptom) => {
    setEditingSymptom(symptom);
    setShowForm(true);
  };

  const handleDeleteSymptom = async (symptom) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce symptôme ?')) {
      try {
        await deleteSymptom(symptom.id);
      } catch (error) {
        console.error("Erreur lors de la suppression :", error);
      }
    }
  };

  const getSymptomStats = () => {
    const totalSymptoms = symptoms.length;
    const uniqueSymptoms = Object.keys(groupedSymptoms).length;
    const avgIntensity = symptoms.length > 0 
      ? (symptoms.reduce((sum, s) => sum + s.intensity, 0) / symptoms.length).toFixed(1)
      : 0;
    
    return { totalSymptoms, uniqueSymptoms, avgIntensity };
  };

  const stats = getSymptomStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-50 via-white to-health-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gradient mb-2">Suivi des Symptômes</h1>
          <p className="text-neutral-600">Enregistrez et suivez l'évolution de vos symptômes</p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card-medical p-6 text-center">
            <Activity className="h-8 w-8 text-medical-500 mx-auto mb-3" />
            <div className="text-2xl font-bold text-neutral-800">{stats.totalSymptoms}</div>
            <div className="text-sm text-neutral-600">Symptômes enregistrés</div>
          </div>
          
          <div className="card-medical p-6 text-center">
            <BarChart3 className="h-8 w-8 text-health-500 mx-auto mb-3" />
            <div className="text-2xl font-bold text-neutral-800">{stats.uniqueSymptoms}</div>
            <div className="text-sm text-neutral-600">Types différents</div>
          </div>
          
          <div className="card-medical p-6 text-center">
            <TrendingUp className="h-8 w-8 text-yellow-500 mx-auto mb-3" />
            <div className="text-2xl font-bold text-neutral-800">{stats.avgIntensity}/10</div>
            <div className="text-sm text-neutral-600">Intensité moyenne</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-3">
            <button
              onClick={() => setViewMode('grouped')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                viewMode === 'grouped'
                  ? 'bg-medical-100 text-medical-700'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              Vue groupée
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                viewMode === 'timeline'
                  ? 'bg-medical-100 text-medical-700'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              Chronologique
            </button>
          </div>
          
          <button
            onClick={() => {
              setEditingSymptom(null);
              setShowForm(true);
            }}
            className="btn-primary inline-flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Nouveau symptôme</span>
          </button>
        </div>

        {/* Contenu principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulaire */}
          {showForm && (
            <div className="lg:col-span-1">
              <SymptomForm 
                editingSymptom={editingSymptom}
                onClose={() => {
                  setShowForm(false);
                  setEditingSymptom(null);
                }}
              />
            </div>
          )}

          {/* Liste des symptômes */}
          <div className={showForm ? "lg:col-span-2" : "lg:col-span-3"}>
            {viewMode === 'grouped' ? (
              // Vue groupée par nom de symptôme
              <div className="space-y-6">
                {Object.keys(groupedSymptoms).length > 0 ? (
                  Object.entries(groupedSymptoms).map(([symptomName, symptomList]) => (
                    <div key={symptomName} className="space-y-4">
                      <h3 className="text-xl font-bold text-neutral-800 capitalize flex items-center space-x-2">
                        <Activity className="h-5 w-5 text-medical-500" />
                        <span>{symptomName}</span>
                        <span className="text-sm font-normal text-neutral-500">
                          ({symptomList.length} entrée{symptomList.length > 1 ? 's' : ''})
                        </span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {symptomList
                          .sort((a, b) => new Date(b.date) - new Date(a.date))
                          .map((symptom) => (
                            <SymptomCard
                              key={symptom.id}
                              symptom={symptom}
                              onEdit={handleEditSymptom}
                              onDelete={handleDeleteSymptom}
                              compact={true}
                            />
                          ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="card-medical p-12 text-center">
                    <Activity className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-neutral-600 mb-2">
                      Aucun symptôme enregistré
                    </h3>
                    <p className="text-neutral-500 mb-6">
                      Commencez à suivre vos symptômes pour un meilleur suivi médical
                    </p>
                    <button
                      onClick={() => setShowForm(true)}
                      className="btn-primary inline-flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Ajouter un symptôme</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Vue chronologique
              <div className="space-y-4">
                {symptoms
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((symptom) => (
                    <SymptomCard
                      key={symptom.id}
                      symptom={symptom}
                      onEdit={handleEditSymptom}
                      onDelete={handleDeleteSymptom}
                    />
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};