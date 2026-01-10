import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from './TermsOfService.module.css';

const UPDATE_DATE = '2025-06-20';

export default function TermsOfService() {
  const { t, i18n } = useTranslation('terms');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Отримуємо масив секцій з перекладу
  const sections = t('sections', { returnObjects: true });

  // Форматування дати відповідно до мови користувача
  const formattedDate = new Date(UPDATE_DATE).toLocaleDateString(i18n.language, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1>{t('title')}</h1>
          <p>{t('last_updated', { date: formattedDate })}</p>
        </div>

        <div className={styles.content}>
          {Array.isArray(sections) && sections.map((section, index) => (
            <section key={index} className={styles.section}>
              <h2>{section.title}</h2>
              {section.content.map((paragraph, pIndex) => (
                <p key={pIndex}>{paragraph}</p>
              ))}
            </section>
          ))}

          <div className={styles.footer}>
            <p>
              {t('footer.return')} <Link to="/register" className={styles.link}>{t('footer.register')}</Link> {t('footer.or')}{' '}
              <Link to="/" className={styles.link}>{t('footer.home')}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}