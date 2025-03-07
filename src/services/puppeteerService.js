// src/services/puppeteerService.js

import puppeteer from 'puppeteer';

/**
 * Récupère les informations d'un médicament sur compendium.ch
 * @param {string} medicamentName - Nom du médicament à rechercher
 * @returns {Promise<object>} Informations du médicament
 */
export const fetchMedicamentInfo = async (medicamentName) => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        await page.goto('https://compendium.ch/fr', { waitUntil: 'domcontentloaded' });

        // Entrer le nom du médicament dans le champ de recherche
        await page.type('input[name="search"]', medicamentName);
        await page.keyboard.press('Enter');
        await page.waitForNavigation({ waitUntil: 'domcontentloaded' });

        // Sélectionner le premier résultat
        const firstResultSelector = '.search-results a';
        await page.waitForSelector(firstResultSelector);
        await page.click(firstResultSelector);
        await page.waitForNavigation({ waitUntil: 'domcontentloaded' });

        // Extraire les informations clés du médicament
        const medicamentInfo = await page.evaluate(() => {
            return {
                name: document.querySelector('h1')?.innerText.trim() || 'Nom inconnu',
                type: document.querySelector('.product-type')?.innerText.trim() || 'Non spécifié',
                dosage: document.querySelector('.dosage-info')?.innerText.trim() || 'Non précisé',
                frequency: document.querySelector('.frequency-info')?.innerText.trim() || 'Non précisée',
                warnings: document.querySelector('.warnings')?.innerText.trim() || 'Aucun avertissement',
                sideEffects: document.querySelector('.side-effects')?.innerText.trim() || 'Aucun effet secondaire connu',
                advice: document.querySelector('.usage-advice')?.innerText.trim() || 'Aucun conseil spécifique',
            };
        });

        return medicamentInfo;
    } catch (error) {
        console.error('Erreur lors de la récupération des informations du médicament :', error);
        return null;
    } finally {
        await browser.close();
    }
};
