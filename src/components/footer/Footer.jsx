import React from 'react';
import styles from './Footer.module.css';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation('footer');

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.footerSection}>
          <h3>GeoAnalyzer</h3>
          <p>{t('description')}</p>
        </div>
        <div className={styles.footerSection}>
          <h4>{t('nav_title')}</h4>
          <Link to="/">{t('home')}</Link>
          <Link to="/about">{t('about')}</Link>
          <Link to="/contacts">{t('contacts')}</Link>
          <Link to="/terms">{t('terms')}</Link>
        </div>
        <div className={styles.footerSection}>
          <h4>{t('contacts_title')}</h4>
          <p>email: info@geoanalyzer.com</p>
          <p>tel: +380 00 000 00 00</p>
        </div>
      </div>
      <div className={styles.copyright}>
        © {new Date().getFullYear()} GeoAnalyzer. {t('rights')}.
      </div>
    </footer>
  );
}