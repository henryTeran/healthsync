import { logError } from '../lib/logger';
import { simulationMedicationsCompendium } from '../../data/simulationMedicationsCompendium';

const API_URL = import.meta.env.VITE_DOCUMEDIS_API_URL;
const API_TOKEN = import.meta.env.VITE_DOCUMEDIS_TOKEN;

const BEARER_TOKEN = API_TOKEN;

const toDocumedisShape = (items) => ({
  products: items.map((item, index) => ({
    productNumber: index + 1,
    description: item.name,
    atcCode: item.type || 'N/A',
    compactMonographieDosageDescription: item.dosage || 'Dosage non précisé',
    compactMonographieIndicationDescription: item.indication || 'Indication non précisée',
    smallestArticle: {
      description: item.packaging || 'Conditionnement test',
      companyName: item.company || 'Données locales',
    },
  })),
});

const searchMedicationsFromLocalData = (medName) => {
  const query = (medName || '').trim().toLowerCase();
  const filtered = simulationMedicationsCompendium.filter((item) =>
    item.name.toLowerCase().includes(query)
  );

  return toDocumedisShape(filtered.slice(0, 10));
};

export const searchMedications = async (medName) => {
  if (!API_URL || !BEARER_TOKEN) {
    return searchMedicationsFromLocalData(medName);
  }

  const headers = {
    Authorization: `Bearer ${BEARER_TOKEN}`,
    'Accept-Language': 'fr-CH',
    'HCI-CustomerId': '628632',
    'HCI-Index': 'MedIndex',
    'HCI-SoftwareOrgId': '628632',
    'HCI-SoftwareOrg': btoa('HenryTeran'),
    'HCI-Software': btoa('HealthSync'),
    'Content-Type': 'application/json',
  };

  const body = JSON.stringify({
    powerSearchQueries: [medName],
    type: 'Default',
    returnFilters: true,
    returnProducts: true,
    onlySubCatalogProducts: false,
    productNumbers: [0],
    searchMode: 'Primary',
    searchExactQ: true,
    productsInSubCatalogFirst: true,
    productsInTradeSecondOrFirst: true,
    q: medName,
    offset: 0,
    limit: 10,
    maximumTotalResult: 10,
    sort: 'string',
    selectedFilters: 'string',
  });

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers,
      body,
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP : ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    logError('Erreur API Documedis', error, {
      feature: 'documedis',
      action: 'searchMedications',
      medName,
    });
    return searchMedicationsFromLocalData(medName);
  }
};
