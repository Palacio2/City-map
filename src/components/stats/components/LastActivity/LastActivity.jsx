import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FaExternalLinkAlt, FaMapMarkerAlt } from 'react-icons/fa';
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
    // ОПТИМІЗАЦІЯ: Безпечна перевірка (Optional Chaining)
    if (district?.city && district?.country && district?.name) {
      navigate(`/map/${encodeURIComponent(district.country)}/${encodeURIComponent(district.city)}?district=${encodeURIComponent(district.name)}`);
    }
  };

  const formattedDate = lastActive ? formatDate(lastActive, i18n.language) : t('stats_page.never');
  const hasValidDistrict = !!(favoriteDistrict?.name && favoriteDistrict?.city && favoriteDistrict?.country);

  return (
    <div className={styles.container}>
      <div className={styles.statusGroup}>
        <div className={styles.indicatorWrapper}>
          <div className={styles.pulsingDot}></div>
        </div>
        <div className={styles.textGroup}>
          <span className={styles.statusLabel}>{t('stats_page.online')}</span>
          <span className={styles.timeLabel}>{t('stats_page.last_active_at', { time: formattedDate })}</span>
        </div>
      </div>

      <div className={styles.divider}></div>

      <div className={styles.favoriteGroup}>
        <span className={styles.metaLabel}>{t('stats_page.fav_district')}</span>
        {hasValidDistrict ? (
          <button 
            className={styles.districtButton} 
            onClick={() => handleDistrictNavigate(favoriteDistrict)}
          >
            <FaMapMarkerAlt className={styles.pinIcon} />
            <span className={styles.districtName}>{favoriteDistrict.name}</span>
            <FaExternalLinkAlt className={styles.linkIcon} />
          </button>
        ) : (
          <span className={styles.emptyValue}>{t('stats_page.not_defined')}</span>
        )}
      </div>
    </div>
  );
}