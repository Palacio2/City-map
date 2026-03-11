import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next'; // ДОДАНО

export default function SeoMeta({ title, description }) {
  const { i18n } = useTranslation(); // Отримуємо поточну мову юзера

  return (
    <Helmet>
      {/* Динамічно змінюємо <html lang="uk/en/pl"> залежно від мови */}
      <html lang={i18n.language || 'uk'} /> 
      
      <title>{title}</title>
      <meta name="description" content={description} />
      
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
}