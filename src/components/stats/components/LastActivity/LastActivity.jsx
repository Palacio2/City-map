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

  // ВАЖЛИВО: Ці змінні мають бути ТУТ, всередині функції компонента,
  // оскільки саме тут доступний пропс favoriteDistrict.
  const districtName = favoriteDistrict?.name || favoriteDistrict?.district;
  const districtCity = favoriteDistrict?.city || favoriteDistrict?.cities?.name;
  const districtCountry = favoriteDistrict?.country || favoriteDistrict?.cities?.countries?.name;

  const handleDistrictNavigate = () => {
    if (districtName && districtCity && districtCountry) {
      navigate(`/map/${encodeURIComponent(districtCountry)}/${encodeURIComponent(districtCity)}?district=${encodeURIComponent(districtName)}`);
    }
  };

  const formattedDate = lastActive ? formatDate(lastActive, i18n.language) : t('stats_page.never');
  const hasValidDistrict = !!(districtName && districtCity && districtCountry);

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
            onClick={handleDistrictNavigate}
          >
            <FaMapMarkerAlt className={styles.pinIcon} />
            <span className={styles.districtName}>{districtName}</span>
            <FaExternalLinkAlt className={styles.linkIcon} />
          </button>
        ) : (
          <span className={styles.emptyValue}>{t('stats_page.not_defined')}</span>
        )}
      </div>
    </div>
  );
}