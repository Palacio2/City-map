import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FaClock, FaExternalLinkAlt } from 'react-icons/fa';
import styles from './LastActivity.module.css';

const formatDate = (dateString, lang) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString(lang, {
    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
  });
};

export default function LastActivity({ lastActive, favoriteDistrict }) {
  const { t, i18n } = useTranslation('stats');
  const navigate = useNavigate();

  const handleDistrictNavigate = (district) => {
    if (district && district.city && district.country && district.name) {
      navigate(`/map/${encodeURIComponent(district.country)}/${encodeURIComponent(district.city)}?district=${encodeURIComponent(district.name)}`);
    }
  };

  const formattedDate = lastActive ? formatDate(lastActive, i18n.language) : t('stats_page.never');

  const hasValidDistrict = favoriteDistrict && favoriteDistrict.name && favoriteDistrict.city && favoriteDistrict.country;

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <FaClock className={styles.sectionIcon} />
        <h2 className={styles.sectionTitle}>{t('stats_page.last_activity')}</h2>
      </div>
      <div className={styles.lastActivity}>
        <div className={styles.activityStatus}>
          <div className={styles.statusIndicator}></div>
          <div className={styles.statusInfo}>
            <span className={styles.statusText}>{t('stats_page.online')}</span>
            <span className={styles.statusTime}>{t('stats_page.last_active_at', { time: formattedDate })}</span>
          </div>
        </div>
        <div className={styles.favoriteInfo}>
          <span className={styles.favoriteLabel}>{t('stats_page.fav_district')}:</span>
          {hasValidDistrict ? (
            <span className={`${styles.favoriteValue} ${styles.clickableText}`} onClick={() => handleDistrictNavigate(favoriteDistrict)}>
              {favoriteDistrict.name} <FaExternalLinkAlt className={styles.linkIcon} />
            </span>
          ) : (
            <span className={styles.favoriteValue}>{t('stats_page.not_defined')}</span>
          )}
        </div>
      </div>
    </div>
  );
}