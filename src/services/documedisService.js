const API_URL = import.meta.env.VITE_DOCUMEDIS_API_URL;
const API_TOKEN = import.meta.env.VITE_DOCUMEDIS_TOKEN;
console.log(API_URL);
console.log(API_TOKEN);



// Remplace par ton vrai token reçu par SMS
const BEARER_TOKEN = API_TOKEN;
export const searchMedications = async (medName) => {
    console.log(medName)
    const headers = {
        "Authorization": `Bearer ${BEARER_TOKEN}`,
        "Accept-Language": "fr-CH",
        "HCI-CustomerId": "628632",
        "HCI-Index": "MedIndex",
        "HCI-SoftwareOrgId": "628632",
        "HCI-SoftwareOrg": btoa("HenryTeran"), // Encode en Base64
        "HCI-Software": btoa("HealthSync"), // Encode en Base64
        "Content-Type": "application/json",
    };
    const body = JSON.stringify({
        powerSearchQueries: [medName], // Recherche du médicament
        type: "Default",
        returnFilters: true,
        returnProducts: true,
        onlySubCatalogProducts: false, //  Correction ici
        productNumbers: [0],
        searchMode: "Primary",
        searchExactQ: true,
        productsInSubCatalogFirst: true,
        productsInTradeSecondOrFirst: true,
        q: medName,
        offset: 0,
        limit: 10,
        maximumTotalResult: 10,
        sort: "string",
        selectedFilters: "string"
    });

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: headers,
            body: body
        });
        console.log("hola", response);


        if (!response.ok) throw new Error(`Erreur HTTP : ${response.status}`);

         // Lire le JSON une seule fois et le stocker dans une variable
         const data = await response.json();
         console.log("✅ Réponse API :", data);
 
         return data;
    } catch (error) {
        console.error("Erreur API Documedis :", error);
        return null;
    }
};

