import React from 'react';
import styles from './Footer.module.css';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation(['footer', 'header']);
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        
        <div className={styles.footerSection}>
          <h3>GeoAnalyzer</h3>
          <p>{t('footer:description')}</p>
        </div>

        <div className={styles.footerSection}>
          <h4>{t('footer:nav_title')}</h4>
          <nav className={styles.navLinks}>
            <Link to="/">{t('header:home')}</Link>
            <Link to="/about">{t('header:about')}</Link>
            <Link to="/contacts">{t('header:contacts')}</Link>
            
            <Link to="/terms">{t('footer:terms')}</Link>
            <Link to="/faq">{t('footer:faq')}</Link>
          </nav>
        </div>

        <div className={styles.footerSection}>
          <h4>{t('footer:contacts_title')}</h4>
          <a href={`mailto:${t('footer:email')}`} className={styles.contactLink}>
            {t('footer:email')}
          </a>
          <a href={`tel:${t('footer:phone_raw')}`} className={styles.contactLink}>
            {t('footer:phone')}
          </a>
        </div>
      </div>

      <div className={styles.copyright}>
        © {year} GeoAnalyzer. {t('footer:rights')}.
      </div>
    </footer>
  );
}