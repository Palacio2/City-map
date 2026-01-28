import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import headerUK from './locales/uk/header.json'; 
import headerEN from './locales/en/header.json';
import headerPL from './locales/pl/header.json';

import footerUK from './locales/uk/footer.json'; 
import footerEN from './locales/en/footer.json';
import footerPL from './locales/pl/footer.json';

import faqUK from './locales/uk/faq.json';
import faqEN from './locales/en/faq.json';
import faqPL from './locales/pl/faq.json';

// ✅ ІМПОРТ НОВИХ ФАЙЛІВ
import authUK from './locales/uk/auth.json';
import authEN from './locales/en/auth.json';
import authPL from './locales/pl/auth.json';
import selectUK from './locales/uk/select.json';
import selectEN from './locales/en/select.json';
import selectPL from './locales/pl/select.json';

import districtsUK from './locales/uk/districts.json';
import districtsEN from './locales/en/districts.json';
import districtsPL from './locales/pl/districts.json';

import filtersUK from './locales/uk/filters.json';
import filtersEN from './locales/en/filters.json';
import filtersPL from './locales/pl/filters.json';

import profileUK from './locales/uk/profile.json';
import profileEN from './locales/en/profile.json';
import profilePL from './locales/pl/profile.json';

import aboutUK from './locales/uk/about.json';
import aboutEN from './locales/en/about.json';
import aboutPL from './locales/pl/about.json';

import contactsUK from './locales/uk/contacts.json';
import contactsEN from './locales/en/contacts.json';
import contactsPL from './locales/pl/contacts.json';

import favoritesUK from './locales/uk/favorites.json';
import favoritesEN from './locales/en/favorites.json';
import favoritesPL from './locales/pl/favorites.json';

import paymentUK from './locales/uk/payment.json';
import paymentEN from './locales/en/payment.json';
import paymentPL from './locales/pl/payment.json';

import subscriptionUK from './locales/uk/subscription.json';
import subscriptionEN from './locales/en/subscription.json';
import subscriptionPL from './locales/pl/subscription.json';

import termsEN from './locales/en/terms.json';
import termsPl from './locales/pl/terms.json';
import termsUK from './locales/uk/terms.json';

import NotFoundPageEN from './locales/en/404.json';
import NotFoundPagePL from './locales/pl/404.json';
import NotFoundPageUK from './locales/uk/404.json';

import RodoEN from './locales/en/rodo.json';
import RodoPL from './locales/pl/rodo.json';
import RodoUK from './locales/uk/rodo.json';

import StatsEN from './locales/en/stats.json';
import StatsPL from './locales/pl/stats.json';
import StatsUK from './locales/uk/stats.json';

import ComparisonEN from './locales/en/comparison.json';
import ComparisonPL from './locales/pl/comparison.json';
import ComparisonUK from './locales/uk/comparison.json';

const resources = {
  ua: { 
    header: headerUK,
    footer: footerUK,
    faq: faqUK,
    auth: authUK,
    select: selectUK,
    districts: districtsUK,
    filters: filtersUK,
    profile: profileUK,
    about: aboutUK,
    contacts: contactsUK,
    favorites: favoritesUK,
    payment: paymentUK,
    subscription: subscriptionUK,
    terms: termsUK,
    notFound: NotFoundPageUK,
    rodo : RodoUK,
    stats : StatsUK,
    comparison :ComparisonUK,
  },
  en: { 
    header: headerEN,
    footer: footerEN,
    faq: faqEN,
    auth: authEN,
    select: selectEN,
    districts: districtsEN,
    filters: filtersEN,
    profile: profileEN,
    about: aboutEN,
    contacts: contactsEN,
    favorites: favoritesEN,
    payment: paymentEN,
    subscription: subscriptionEN,
    terms: termsEN,
    notFound: NotFoundPageEN,
    rodo : RodoEN,
    stats : StatsEN,
    comparison :ComparisonEN,
  },
  pl: { 
    header: headerPL,
    footer: footerPL,
    faq: faqPL,
    auth: authPL,
    select: selectPL,
    districts: districtsPL,
    filters: filtersPL,
    profile: profilePL,
    about: aboutPL,
    contacts: contactsPL,
    favorites: favoritesPL,
    payment: paymentPL,
    subscription: subscriptionPL,
    terms: termsPl,
    notFound: NotFoundPagePL,
    rodo : RodoPL,
    stats : StatsPL,
    comparison :ComparisonPL,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',

    detection: {
      order: ['localStorage', 'cookie', 'navigator'],
      caches: ['localStorage', 'cookie'],
    },
    
    ns: ['header', 'footer', 'faq', 'auth', 'select', 'stats',
       'districts', 'filters', 'profile', 'about', 'rodo', 'comparison',
        'contacts', 'favorites', 'payment', 'subscription', 'terms', 'notFound'], 
    defaultNS: 'header',

    debug: true,

    interpolation: {
      escapeValue: false,
    }
  });

export default i18n;