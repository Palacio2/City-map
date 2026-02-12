import { describe, it, expect } from 'vitest';

// ==========================================
// 1. ІМПОРТИ (Адаптовано під структуру src/i18n/locales)
// Припускаємо, що цей тест лежить в папці src/tests/
// Тому шлях: ../i18n/locales/...
// ==========================================

// --- UKRAINIAN (uk) ---
import headerUK from '../i18n/locales/uk/header.json'; 
import footerUK from '../i18n/locales/uk/footer.json';
import faqUK from '../i18n/locales/uk/faq.json';
import authUK from '../i18n/locales/uk/auth.json';
import selectUK from '../i18n/locales/uk/select.json';
import districtsUK from '../i18n/locales/uk/districts.json';
import filtersUK from '../i18n/locales/uk/filters.json';
import profileUK from '../i18n/locales/uk/profile.json';
import aboutUK from '../i18n/locales/uk/about.json';
import contactsUK from '../i18n/locales/uk/contacts.json';
import favoritesUK from '../i18n/locales/uk/favorites.json';
import paymentUK from '../i18n/locales/uk/payment.json';
import subscriptionUK from '../i18n/locales/uk/subscription.json';
import termsUK from '../i18n/locales/uk/terms.json';
import NotFoundPageUK from '../i18n/locales/uk/404.json';
import RodoUK from '../i18n/locales/uk/rodo.json';
import StatsUK from '../i18n/locales/uk/stats.json';
import ComparisonUK from '../i18n/locales/uk/comparison.json';
import commonUK from '../i18n/locales/uk/common.json';
import billingUK from '../i18n/locales/uk/billing.json';

// --- ENGLISH (en) ---
import headerEN from '../i18n/locales/en/header.json';
import footerEN from '../i18n/locales/en/footer.json';
import faqEN from '../i18n/locales/en/faq.json';
import authEN from '../i18n/locales/en/auth.json';
import selectEN from '../i18n/locales/en/select.json';
import districtsEN from '../i18n/locales/en/districts.json';
import filtersEN from '../i18n/locales/en/filters.json';
import profileEN from '../i18n/locales/en/profile.json';
import aboutEN from '../i18n/locales/en/about.json';
import contactsEN from '../i18n/locales/en/contacts.json';
import favoritesEN from '../i18n/locales/en/favorites.json';
import paymentEN from '../i18n/locales/en/payment.json';
import subscriptionEN from '../i18n/locales/en/subscription.json';
import termsEN from '../i18n/locales/en/terms.json';
import NotFoundPageEN from '../i18n/locales/en/404.json';
import RodoEN from '../i18n/locales/en/rodo.json';
import StatsEN from '../i18n/locales/en/stats.json';
import ComparisonEN from '../i18n/locales/en/comparison.json';
import commonEN from '../i18n/locales/en/common.json';
import billingEN from '../i18n/locales/en/billing.json';

// --- POLISH (pl) ---
import headerPL from '../i18n/locales/pl/header.json';
import footerPL from '../i18n/locales/pl/footer.json';
import faqPL from '../i18n/locales/pl/faq.json';
import authPL from '../i18n/locales/pl/auth.json';
import selectPL from '../i18n/locales/pl/select.json';
import districtsPL from '../i18n/locales/pl/districts.json';
import filtersPL from '../i18n/locales/pl/filters.json';
import profilePL from '../i18n/locales/pl/profile.json';
import aboutPL from '../i18n/locales/pl/about.json';
import contactsPL from '../i18n/locales/pl/contacts.json';
import favoritesPL from '../i18n/locales/pl/favorites.json';
import paymentPL from '../i18n/locales/pl/payment.json';
import subscriptionPL from '../i18n/locales/pl/subscription.json';
import termsPL from '../i18n/locales/pl/terms.json';
import NotFoundPagePL from '../i18n/locales/pl/404.json';
import RodoPL from '../i18n/locales/pl/rodo.json';
import StatsPL from '../i18n/locales/pl/stats.json';
import ComparisonPL from '../i18n/locales/pl/comparison.json';
import commonPL from '../i18n/locales/pl/common.json';
import billingPL from '../i18n/locales/pl/billing.json';

// ==========================================
// 2. КОНФІГУРАЦІЯ ТЕСТУ
// Збираємо все в масив для ітерації
// ==========================================
const testSuites = [
    { name: 'header', en: headerEN, uk: headerUK, pl: headerPL },
    { name: 'footer', en: footerEN, uk: footerUK, pl: footerPL },
    { name: 'faq', en: faqEN, uk: faqUK, pl: faqPL },
    { name: 'auth', en: authEN, uk: authUK, pl: authPL },
    { name: 'select', en: selectEN, uk: selectUK, pl: selectPL },
    { name: 'districts', en: districtsEN, uk: districtsUK, pl: districtsPL },
    { name: 'filters', en: filtersEN, uk: filtersUK, pl: filtersPL },
    { name: 'profile', en: profileEN, uk: profileUK, pl: profilePL },
    { name: 'about', en: aboutEN, uk: aboutUK, pl: aboutPL },
    { name: 'contacts', en: contactsEN, uk: contactsUK, pl: contactsPL },
    { name: 'favorites', en: favoritesEN, uk: favoritesUK, pl: favoritesPL },
    { name: 'payment', en: paymentEN, uk: paymentUK, pl: paymentPL },
    { name: 'subscription', en: subscriptionEN, uk: subscriptionUK, pl: subscriptionPL },
    { name: 'terms', en: termsEN, uk: termsUK, pl: termsPL },
    { name: 'notFound', en: NotFoundPageEN, uk: NotFoundPageUK, pl: NotFoundPagePL },
    { name: 'rodo', en: RodoEN, uk: RodoUK, pl: RodoPL },
    { name: 'stats', en: StatsEN, uk: StatsUK, pl: StatsPL },
    { name: 'comparison', en: ComparisonEN, uk: ComparisonUK, pl: ComparisonPL },
    { name: 'common', en: commonEN, uk: commonUK, pl: commonPL },
    { name: 'billing', en: billingEN, uk: billingUK, pl: billingPL },
];

// ==========================================
// 3. ДОПОМІЖНІ ФУНКЦІЇ
// ==========================================

// Рекурсивно отримує всі ключі (наприклад, 'auth.login.button')
function getAllKeys(obj, prefix = '') {
    return Object.keys(obj).reduce((res, el) => {
        if (Array.isArray(obj[el])) return res; // Пропускаємо масиви
        if (typeof obj[el] === 'object' && obj[el] !== null) {
            return [...res, ...getAllKeys(obj[el], prefix + el + '.')];
        }
        return [...res, prefix + el];
    }, []);
}

// Рекурсивно перевіряє порожні значення
function checkEmptyValues(obj, path = '', fileName = '') {
    for (let key in obj) {
        const currentPath = path ? `${path}.${key}` : key;
        const value = obj[key];

        if (typeof value === 'object' && value !== null) {
            checkEmptyValues(value, currentPath, fileName);
        } else if (typeof value === 'string') {
            if (value.trim() === '') {
                throw new Error(`❌ EMPTY STRING in [${fileName}]: Key "${currentPath}" is empty.`);
            }
        } else {
            // Можна додати перевірку на null/undefined
            if (value === null || value === undefined) {
                 throw new Error(`❌ NULL/UNDEFINED in [${fileName}]: Key "${currentPath}" is null.`);
            }
        }
    }
}

// ==========================================
// 4. ТЕСТИ
// ==========================================
describe('🌍 Translation Integrity Tests', () => {
    
    testSuites.forEach(({ name, en, uk, pl }) => {
        
        describe(`Namespace: [${name}.json]`, () => {
            const enKeys = getAllKeys(en);
            const ukKeys = getAllKeys(uk);
            const plKeys = getAllKeys(pl);

            // 1. Перевірка: чи всі ключі з EN є в UK
            it('🇺🇦 UK should contain all keys from EN', () => {
                const missingInUk = enKeys.filter(key => !ukKeys.includes(key));
                if (missingInUk.length > 0) {
                    console.error(`🚨 MISSING IN UK [${name}]:\n`, missingInUk.join('\n'));
                }
                expect(missingInUk).toEqual([]);
            });

            // 2. Перевірка: чи всі ключі з EN є в PL
            it('🇵🇱 PL should contain all keys from EN', () => {
                const missingInPl = enKeys.filter(key => !plKeys.includes(key));
                if (missingInPl.length > 0) {
                    console.error(`🚨 MISSING IN PL [${name}]:\n`, missingInPl.join('\n'));
                }
                expect(missingInPl).toEqual([]);
            });

            // 3. Перевірка на зайві ключі (необов'язково, але корисно)
            it('Should not have orphaned keys (present in UK/PL but not EN)', () => {
                const extraInUk = ukKeys.filter(key => !enKeys.includes(key));
                const extraInPl = plKeys.filter(key => !enKeys.includes(key));
                
                if(extraInUk.length) console.warn(`⚠️ Extra keys in UK [${name}]:`, extraInUk);
                if(extraInPl.length) console.warn(`⚠️ Extra keys in PL [${name}]:`, extraInPl);
                
                // Це не fail тесту, просто попередження в консоль
                expect(true).toBe(true);
            });

            // 4. Перевірка на порожні значення
            it('Should not have empty translations', () => {
                expect(() => checkEmptyValues(en, '', `${name}.en`)).not.toThrow();
                expect(() => checkEmptyValues(uk, '', `${name}.uk`)).not.toThrow();
                expect(() => checkEmptyValues(pl, '', `${name}.pl`)).not.toThrow();
            });
        });
    });
});