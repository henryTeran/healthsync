import React from "react";
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from "@react-pdf/renderer";
import PropTypes from "prop-types";

// Styles du document PDF
const styles = StyleSheet.create({
  page: { padding: 20, fontSize: 12 },
  section: { marginBottom: 10 },
  title: { fontSize: 16, fontWeight: "bold", marginBottom: 10 },
  text: { marginBottom: 5 },
  table: { width: "100%", border: "1px solid black", marginBottom: 10 },
  row: { flexDirection: "row", borderBottom: "1px solid black", padding: 5 },
  header: { fontWeight: "bold", backgroundColor: "#e4e4e4" },
  cell: { flex: 1, textAlign: "center" },
});

const PrescriptionPDF = ({ prescription }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Section entête Médecin */ }
        <View style={styles.section}>
          <Text style={styles.text}>{prescription.profilDoctor.firstName} {prescription.profilDoctor.lastName}</Text>
          <Text style={styles.text}>{prescription.profilDoctor.address} </Text>
          <Text style={styles.text}>{prescription.profilDoctor.postalCode} {prescription.profilDoctor.state}</Text>
          <Text style={styles.text}>Téléphones: {prescription.profilDoctor.mobileNumber}</Text> 
          <Text style={styles.text}>Email: {prescription.profilDoctor.email}</Text> 
        </View>

         {/* Section entête patient */ }
         <View style={styles.section}>
          <Text style={styles.text}>Patient {prescription.profilPatient.firstName} {prescription.profilPatient.lastName} {prescription.profilPatient.age} ans </Text>
         
        </View>

        {/* partie date et litre document */}
        <View style={styles.text}>
          <Text style={styles.text}>Date: {new Date(prescription.date).toLocaleDateString()}</Text>

        </View> 

        <View style={styles.title}>
          <Text style={styles.title}>Prescription Médicale</Text> 
             
        </View> 

        {/* Tableau des médicaments */}
        <View style={styles.table}>
          <View style={[styles.row, styles.header]}>
            <Text style={styles.cell}>Quantité</Text>
            <Text style={styles.cell}>Nom du Médicament</Text>
            <Text style={styles.cell}>Dosage</Text>
            <Text style={styles.cell}>Fréquence</Text>
          </View>
          {prescription.medications.map((med, index) => (
            <View key={index} style={styles.row}>
              <Text style={styles.cell}>{med.quantity}</Text>
              <Text style={styles.cell}>{med.name}</Text>
              <Text style={styles.cell}>{med.dosage}</Text>
              <Text style={styles.cell}>{med.frequency}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.text}>Signature du Médecin: __________________</Text>
      </Page>
    </Document>
  );
};

// Lien pour télécharger le PDF
export const PrescriptionPDFDownload = ({ prescription }) => (
  <PDFDownloadLink document={<PrescriptionPDF prescription={prescription} />} fileName="prescription.pdf">
    {({ loading }) => (loading ? "Génération du PDF..." : "Télécharger la Prescription 📄")}
  </PDFDownloadLink>
);

PrescriptionPDF.propTypes = {
  prescription: PropTypes.shape({
    profilDoctor: PropTypes.shape({
      firstName: PropTypes.string,
      lastName: PropTypes.string,
      address: PropTypes.string,
      postalCode: PropTypes.string,
      state: PropTypes.string,
      mobileNumber: PropTypes.string,
      email: PropTypes.string,
    }).isRequired,
    profilPatient: PropTypes.shape({ 
      firstName: PropTypes.string.isRequired,
      lastName: PropTypes.string.isRequired,
      age: PropTypes.string.isRequired,
     
    }).isRequired,
    date: PropTypes.string.isRequired,
    medications: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string,
        dosage: PropTypes.string,
        frequency: PropTypes.string,
        quantity: PropTypes.string,
      }).isRequired
    ).isRequired,
  }).isRequired,
};

PrescriptionPDFDownload.propTypes ={ 
  prescription: PropTypes.shape
}
