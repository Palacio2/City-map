import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from './DistrictsMap.module.css';
import { DISTRICT_CATEGORIES } from '@config/districtFields';
import { useSubscription } from '@subscription/SubscriptionContext';

const DistrictCard = React.memo(({ district, onClick, isFree }) => {
  const { t } = useTranslation('districts');
  const [imgError, setImgError] = useState(false);
  const filterData = district.filterData;
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      onClick(district);
    }
  };

  const visibleStats = useMemo(() => {
    if (!filterData) return [];
    
    return Object.values(DISTRICT_CATEGORIES)
      .filter(cat => {
        if (isFree && cat.isPremium) return false;
        const rating = filterData[cat.key]?.rating || filterData[cat.key]?.qualityRating;
        return rating !== undefined && rating !== null;
      })
      .map(cat => ({
        key: cat.key,
        icon: cat.icon,
        rating: filterData[cat.key]?.rating || filterData[cat.key]?.qualityRating
      }));
  }, [filterData, isFree]);

  return (
    <div
      className={styles.districtCard}
      onClick={() => onClick(district)}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.imageWrapper}>
        {district.photo_url && !imgError ? (
            <img 
              src={district.photo_url} 
              alt={district.photo_description || district.name}
              className={styles.districtPhoto}
              loading="lazy"
              width="300"
              height="200"
              onError={() => setImgError(true)} 
            />
        ) : (
            <div className={styles.photoPlaceholder}>🏙️</div>
        )}
      </div>
      
      <div className={styles.districtName}>{district.name}</div>
      
      <div className={styles.districtStats}>
        {visibleStats.map(stat => (
          <span key={stat.key} className={styles.statBadge}>
            {stat.icon} {Number(stat.rating).toFixed(1)}
          </span>
        ))}
      </div>
    </div>
  );
});

export default function DistrictsMap({ 
  districts, 
  onDistrictClick, 
  selectedFilters = {},
  totalCount
}) {
  const { t } = useTranslation('districts');
  const { country, city } = useParams();
  const { isFree } = useSubscription();
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const paginatedDistricts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return districts.slice(startIndex, startIndex + itemsPerPage);
  }, [districts, currentPage]);

  const totalPages = Math.ceil(districts.length / itemsPerPage);
  const hasActiveFilters = Object.keys(selectedFilters).length > 0;

  const shownCount = districts.length;
  const realTotal = totalCount || shownCount;

  return (
    <div className={styles.mapContainer}>
      <div className={styles.mapHeader}>
        <h1 className={styles.title}>
          {decodeURIComponent(city)}, {decodeURIComponent(country)}
        </h1>
        <div className={styles.mapStats}>
          {districts.length > 0 && (
            <span className={styles.statItem}>
              {t('stats_shown', { shown: shownCount, total: realTotal })}
              
              {isFree && realTotal > shownCount && (
                  <span style={{ marginLeft: '6px', opacity: 0.7, fontSize: '0.9em' }}>
                    ({t('premium.hidden_districts_title', { count: realTotal - shownCount })})
                  </span>
              )}
            </span>
          )}
        </div>
      </div>
      
      {districts.length === 0 ? (
        <div className={styles.fullSizeNoData}>
          <div className={styles.placeholder}>
            <div className={styles.placeholderIcon}>{hasActiveFilters ? '🔍' : '🏙️'}</div>
            <h3>{hasActiveFilters ? t('not_found_title') : t('no_data_title')}</h3>
            <p>{hasActiveFilters ? t('not_found_text') : t('no_data_text')}</p>
          </div>
        </div>
      ) : (
        <div className={styles.mapArea}>
          <div className={styles.mapWrapper}>
            <div className={styles.mapContent}>
              <div className={styles.combinedMap}>
                {paginatedDistricts.map(district => (
                  <DistrictCard
                    key={district.id}
                    district={district}
                    onClick={onDistrictClick}
                    isFree={isFree}
                  />
                ))}
              </div>
            </div>
            
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button 
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                >←</button>
                <span>{currentPage} / {totalPages}</span>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >→</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}