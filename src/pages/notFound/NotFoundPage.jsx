import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaMapMarkedAlt, FaHome } from 'react-icons/fa';
import styles from './NotFoundPage.module.css';

export default function NotFoundPage() {
  const { t } = useTranslation('404');

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.iconWrapper} aria-hidden="true">
          <FaMapMarkedAlt />
        </div>
        <h1 className={styles.errorCode}>404</h1>
        
        <h2 className={styles.title}>{t('title')}</h2>
        <p className={styles.description}>{t('desc')}</p>
        
        <Link to="/" className={styles.homeButton}>
          <FaHome /> {t('button')}
        </Link>
      </div>
    </div>
  );
}