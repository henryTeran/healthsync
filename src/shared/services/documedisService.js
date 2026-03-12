import { logError } from '../lib/logger';

const API_URL = import.meta.env.VITE_DOCUMEDIS_API_URL;
const API_TOKEN = import.meta.env.VITE_DOCUMEDIS_TOKEN;

const BEARER_TOKEN = API_TOKEN;

export const searchMedications = async (medName) => {
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
    return null;
  }
};
