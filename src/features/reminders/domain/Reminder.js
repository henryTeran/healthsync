// src/models/Reminder.js

export class Reminder {
    constructor(data) {
      this.id = data.id || null;
      this.userId = data.userId || null;
      this.type = data.type || "medication"; // "medication" ou "appointment"
      this.title = data.title || "";
      this.details = data.details || "";
      this.dateTime = data.dateTime || new Date().toISOString();
      this.status = data.status || "pending"; // "pending", "completed"
      this.notificationEnabled = data.notificationEnabled ?? true;
    }
  
    validate() {
      if (!this.userId) throw new Error("L'ID de l'utilisateur est requis.");
      if (!this.title) throw new Error("Le titre du rappel est requis.");
      if (!this.dateTime) throw new Error("La date/heure du rappel est requise.");
    }
  
    toFirestore() {
      return {
        userId: this.userId,
        type: this.type,
        title: this.title,
        details: this.details,
        dateTime: this.dateTime,
        status: this.status,
        notificationEnabled: this.notificationEnabled,
      };
    }
  
    static fromFirestore(snapshot) {
      const data = snapshot.data();
      return new Reminder({ id: snapshot.id, ...data });
    }
  }
  