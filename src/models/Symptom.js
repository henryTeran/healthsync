// src/models/SymptomEntry.js

export class Symptom {
    constructor(data) {
        this.id = data.id || null;
        this.userId = data.userId || null; // ID du patient
        this.symptomName = data.symptomName.toLowerCase().trim() || "";
        this.intensity = data.intensity || 1; // Intensité de 1 à 10
        this.date = data.date || new Date().toISOString();
        this.notes = data.notes || "";
        this.causes = data.causes || [];
    }

    validate() {
        if (!this.userId) throw new Error("L'ID du patient est requis.");
        if (!this.symptomName) throw new Error("Le nom du symptôme est requis.");
        if (this.intensity < 1 || this.intensity > 10) throw new Error("L'intensité doit être entre 1 et 10.");
        if (!this.causes) throw new Error("Les causes sont requises.");
    }

    toFirestore() {
        return {
            userId: this.userId,
            symptomName: this.symptomName,
            intensity: this.intensity,
            date: this.date,
            notes: this.notes,
            causes: this.causes
        };
    }

    static fromFirestore(snapshot) {
        const data = snapshot.data();
        return new Symptom({ id: snapshot.id, ...data });
    }
}
