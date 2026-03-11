export class Medication {
  constructor(data) {
    this.id = data.id || null;
    this.name = data.name || "";
    this.dosage = data.dosage || "";
    this.frequency = data.frequency || "";
    this.duration = data.duration ||  "";
    this.startDate = data.startDate || null;
    this.endDate = data.endDate || null;
    this.takenStatus = data.takenStatus || false; // Statut de prise
    this.userId = data.userId || null;
  }

  validate() {
    if (!this.name.trim()) throw new Error("Le nom du médicament est requis.");
    if (!this.dosage.trim()) throw new Error("La posologie est requise.");
    if (!this.frequency.trim()) throw new Error("La fréquence est requise.");
    if (!this.userId) throw new Error("L'ID utilisateur est requis.");
    if (!this.duration) throw new Error("La durée est requise.");
  }

  toFirestore() {
    return {
      name: this.name,
      dosage: this.dosage,
      frequency: this.frequency,
      duration: this.duration,
      startDate: this.startDate,
      endDate: this.endDate,
      takenStatus: this.takenStatus,
      userId: this.userId,
    };
  }

  static fromFirestore(snapshot) {
    const data = snapshot.data();
    return new Medication({ id: snapshot.id, ...data });
}
}