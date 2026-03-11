import { Symptom } from "../domain/Symptom";
import {
  createSymptomRecord,
  deleteSymptomRecord,
  subscribeSymptomsByUser,
  updateSymptomRecord,
} from "../infrastructure/symptomRepository.firebase";

export const addSymptomUseCase = async (userId, symptomData) => {
  const symptom = new Symptom({ userId, ...symptomData });
  symptom.validate();
  await createSymptomRecord(symptom.toFirestore());
};

export const getSymptomsByUserRealtimeUseCase = (userId, callback) => {
  return subscribeSymptomsByUser(userId, (symptoms) => {
    callback(symptoms.map((item) => new Symptom({ id: item.id, ...item })));
  });
};

export const updateSymptomUseCase = async (symptomId, updatedData) => {
  await updateSymptomRecord(symptomId, updatedData);
};

export const deleteSymptomUseCase = async (symptomId) => {
  await deleteSymptomRecord(symptomId);
};
