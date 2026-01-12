import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from './DistrictsMap.module.css';
import DistrictDetailsModal from './DistrictDetailsModal';

const DistrictCard = React.memo(({ district, isSelected, onClick }) => {
  const { t } = useTranslation('districts');
  const filterData = district.filterData;
  const na = t('na');
  
  return (
    <div
      className={`${styles.districtCard} ${isSelected ? styles.selected : ''}`}
      onClick={() => onClick(district)}
    >
      {district.photo_url ? (
        <img 
          src={district.photo_url} 
          alt={district.photo_description || district.name}
          className={styles.districtPhoto}
          loading="lazy"
        />
      ) : (
        <div className={styles.photoPlaceholder}>🏙️</div>
      )}
      
      <div className={styles.districtName}>{district.name}</div>
      
      {filterData && (
        <div className={styles.districtStats}>
          <span className={styles.statBadge}>🏫 {filterData.education?.rating?.toFixed(1) || na}</span>
          <span className={styles.statBadge}>🚍 {filterData.transport?.rating?.toFixed(1) || na}</span>
          <span className={styles.statBadge}>🛡️ {filterData.safety?.rating?.toFixed(1) || na}</span>
          <span className={styles.statBadge}>🌳 {filterData.social?.rating?.toFixed(1) || na}</span>
          <span className={styles.statBadge}>🏥 {filterData.medicine?.rating?.toFixed(1) || na}</span>
          <span className={styles.statBadge}>🛒 {filterData.commerce?.rating?.toFixed(1) || na}</span>
        </div>
      )}
    </div>
  );
});

export default function DistrictsMap({ districts, onDistrictClick, selectedFilters = {} }) {
  const { t } = useTranslation('districts');
  const { country, city } = useParams();
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    setCurrentPage(1);
  }, [districts.length, selectedFilters]);

  const handleDistrictClick = useCallback((district) => {
    setSelectedDistrict(district);
    setIsModalOpen(true);
    onDistrictClick?.(district);
  }, [onDistrictClick]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedDistrict(null);
  }, []);

  const visibleDistricts = useMemo(() => districts, [districts]);

  const paginatedDistricts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return visibleDistricts.slice(startIndex, startIndex + itemsPerPage);
  }, [visibleDistricts, currentPage]);

  const totalPages = Math.ceil(visibleDistricts.length / itemsPerPage);
  const hasActiveFilters = Object.keys(selectedFilters).length > 0;

  return (
    <>
      <div className={styles.mapContainer}>
        <div className={styles.mapHeader}>
          <h1 className={styles.title}>
            {decodeURIComponent(city)}, {decodeURIComponent(country)}
          </h1>
          <div className={styles.mapStats}>
            {visibleDistricts.length > 0 && (
              <span className={styles.statItem}>
                {t('stats_shown', { shown: visibleDistricts.length, total: districts.length })}
              </span>
            )}
          </div>
        </div>
        
        {visibleDistricts.length === 0 ? (
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
                      isSelected={selectedDistrict?.id === district.id}
                      onClick={handleDistrictClick}
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

      <DistrictDetailsModal
        district={selectedDistrict}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
}