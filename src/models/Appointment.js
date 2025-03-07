// src/models/Appointment.js

  export class Appointment {
    constructor(data) {
      this.id = data.id;
      this.date = data.date;
      this.time = data.time;
      this.notes = data.notes;
      this.createdBy = data.createdBy;
      this.patientId = data.patientId;
      this.doctorId = data.doctorId;
      this.status = data.status || "en attente"; // Valeur par défaut
    }
  }
