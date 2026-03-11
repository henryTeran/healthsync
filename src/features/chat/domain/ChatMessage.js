// src/models/ChatMessage.js

export class ChatMessage {
    constructor(data) {
      this.conversationId = data.id || null;
      this.senderId = data.senderId || null; // ID de l'expéditeur
      this.receiverId = data.receiverId || null; // ID du destinataire
      this.content = data.content || "";
      this.timestamp = data.timestamp || new Date().toISOString();
      this.status = data.status || ""; // Indique si le message a été envoyé , reçu , lu
    }
  
    validate() {
      if (!this.senderId) throw new Error("L'ID de l'expéditeur est requis.");
      if (!this.receiverId) throw new Error("L'ID du destinataire est requis.");
      if (!this.content) throw new Error("Le contenu du message ne peut pas être vide.");
    }
  
    toFirestore() {
      return {
        conversationId: this.conversationId,
        senderId: this.senderId,
        receiverId: this.receiverId,
        content: this.content,
        timestamp: this.timestamp,
        status: this.status,
      };
    }
  
    static fromFirestore(snapshot) {
      const data = snapshot.data();
      return new ChatMessage({ id: snapshot.id, ...data });
    }
  }
  