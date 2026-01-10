import React from 'react';
import styles from './Footer.module.css';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation('footer');
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        
        {/* Секція опису */}
        <div className={styles.footerSection}>
          <h3>GeoAnalyzer</h3>
          <p>{t('description')}</p>
        </div>

        {/* Навігація */}
        <div className={styles.footerSection}>
          <h4>{t('nav_title')}</h4>
          <nav className={styles.navLinks}>
            <Link to="/">{t('home')}</Link>
            <Link to="/about">{t('about')}</Link>
            <Link to="/contacts">{t('contacts')}</Link>
            <Link to="/terms">{t('terms')}</Link>
            <Link to="/faq">{t('faq')}</Link>
          </nav>
        </div>

        {/* Контакти */}
        <div className={styles.footerSection}>
          <h4>{t('contacts_title')}</h4>
          {/* Використовуємо t() щоб дані були динамічні */}
          <a href={`mailto:${t('email')}`} className={styles.contactLink}>
            {t('email')}
          </a>
          <a href={`tel:${t('phone_raw')}`} className={styles.contactLink}>
            {t('phone')}
          </a>
        </div>
      </div>

      <div className={styles.copyright}>
        © {year} GeoAnalyzer. {t('rights')}.
      </div>
    </footer>
  );
}