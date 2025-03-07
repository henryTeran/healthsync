import { db } from "../providers/firebase";
import { doc, setDoc, getDocs, query, where, collection, deleteDoc } from "firebase/firestore";
import {Medication} from "../models/Medication";
//import puppeteer from 'puppeteer';

export class MedicationService {
  
  static async addMedication(userId, medicationData) {
    try {
      if (!userId || !medicationData) {
        throw new Error("Les données du médicament ou l'ID utilisateur sont manquantes.");
      }
      const medication = new Medication({ ...medicationData, userId });
      medication.validate();
      const docId = `${userId}_${Date.now()}`;
      await setDoc(doc(db, "medications", docId), medication.toFirestore());
    } catch (error) {
      console.error("Erreur lors de l'ajout du médicament :", error);
      throw error;
    }
  }

  static async getMedications(userId) {
    try {
      if (!userId) {
        throw new Error("L'ID utilisateur est requis.");
      }
      const q = query(collection(db, "medications"), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => new Medication({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Erreur lors de la récupération des médicaments :", error);
      throw error;
    }
  }

  static async deleteMedication(medId, userId) {
    try {
      if (!medId || !userId) {
        throw new Error("L'ID du médicament ou l'ID utilisateur est manquant.");
      }

      const medRef = doc(db, "medications", medId);
      const medSnapshot = await getDocs(query(collection(db, "medications"), where("userId", "==", userId)));   //=> cause problème de autorisation
      if (medSnapshot.empty || medSnapshot.docs[0].data().userId !== userId) {
        throw new Error("Médicament introuvable ou non autorisé");
      }
      await deleteDoc(medRef);
    } catch (error) {
      console.error("Erreur lors de la suppression du médicament :", error);
      throw error;
    }
  }
  // Ajout d'une méthode pour mettre à jour le statut de prise
  static async updateMedicationTakenStatus(medId, userId, takenStatus) {
    try {
      if (!medId || !userId || typeof takenStatus !== "boolean") {
        throw new Error("Les données fournies sont invalides.");
      }
      const medRef = doc(db, "medications", medId);
      const medSnapshot = await getDocs(query(collection(db, "medications"), where("userId", "==", userId)));

      if (medSnapshot.empty || medSnapshot.docs[0].data().userId !== userId) {
        throw new Error("Médicament introuvable ou non autorisé");
      }

      await setDoc(medRef, { takenStatus }, { merge: true });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut :", error);
      throw error;
    }
  }


  static async createPrescription(userId, medications) {
    try {
      if (!userId || !Array.isArray(medications) || medications.length === 0) {
        throw new Error("Les données de l'ordonnance sont invalides.");
      }
      const prescriptionId = `${userId}_prescription_${Date.now()}`;
      const prescriptionData = {
        userId,
        medications,
        createdAt: new Date(),
      };
  
      await setDoc(doc(db, "prescriptions", prescriptionId), prescriptionData);
      return prescriptionId;
    } catch (error) {
      console.error("Erreur lors de la création de l'ordonnance :", error);
      throw error;
    }
  }
  static async getPrescriptionsHistory(userId) {
    try {
      if (!userId) {
        throw new Error("L'ID utilisateur est requis.");
      }
      const q = query(collection(db, "prescriptions"), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Erreur lors de la récupération de l'historique :", error);
      throw error;
    }
  }


 
  // Méthode pour rechercher un médicament
  static async searchMedication(query) {
    try {
      if (!query.trim()) {
        throw new Error("La requête de recherche ne peut pas être vide.");
      }

      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
  
      // Navigation vers le site de recherche
      await page.goto("https://compendium.ch/fr");
      await page.type("#search-input", query); // Champ de recherche
      await page.click("#search-button"); // Bouton de recherche
      await page.waitForSelector(".search-results"); // Attendre les résultats
  
      const results = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll(".search-item"));
        return items.map(item => ({
          name: item.querySelector(".item-name").innerText,
          description: item.querySelector(".item-description").innerText,
        }));
      });
  
      await browser.close();
      return results;
    } catch (error) {
      console.error("Erreur lors de la recherche :", error);
      throw error;
    }
  }  
}

