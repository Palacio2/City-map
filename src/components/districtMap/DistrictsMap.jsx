import React, { useState, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import styles from './DistrictsMap.module.css';
import DistrictDetailsModal from './DistrictDetailsModal';

export default function DistrictsMap({ districts, onDistrictClick, selectedFilters = {} }) {
  const { country, city } = useParams();
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDistrictClick = useCallback((district) => {
    setSelectedDistrict(district);
    setIsModalOpen(true);
    onDistrictClick?.(district);
  }, [onDistrictClick]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedDistrict(null);
  }, []);

  // Мемоізація відфільтрованих районів
  const districtsWithSvg = useMemo(() => 
    districts.filter(d => d.svgContent), [districts]);
  
  const districtsWithoutSvg = useMemo(() => 
    districts.filter(d => !d.svgContent), [districts]);

  // Перевірка чи застосовані фільтри
  const hasActiveFilters = useMemo(() => 
    Object.keys(selectedFilters).length > 0 && 
    Object.values(selectedFilters).some(filter => 
      filter && Object.keys(filter).length > 0
    ), [selectedFilters]);

  if (districts.length === 0) {
    return (
      <div className={styles.noDataContainer}>
        <div className={styles.placeholder}>
          <div className={styles.placeholderIcon}>
            {hasActiveFilters ? '🔍' : '🗺️'}
          </div>
          <h3>
            {hasActiveFilters ? 'Райони не знайдені' : 'Райони не знайдені'}
          </h3>
          <p>
            {hasActiveFilters 
              ? 'За вашими критеріями фільтрації не знайдено жодного району' 
              : 'Для цього міста ще не додані райони'
            }
          </p>
          {hasActiveFilters && (
            <button 
              className={styles.clearFiltersHint}
              onClick={() => window.location.reload()}
            >
              Скинути фільтри
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.mapContainer}>
        <div className={styles.mapHeader}>
          <h1 className={styles.title}>
            {decodeURIComponent(city)}, {decodeURIComponent(country)}
          </h1>
          <h2>Карта районів</h2>
          <p className={styles.mapStats}>
            <span className={styles.statItem}>
              {districtsWithSvg.length} з {districts.length} районів з мапами
            </span>
            {hasActiveFilters && (
              <span className={styles.activeFilterBadge}>
                🔍 Застосовані фільтри
              </span>
            )}
            {districtsWithoutSvg.length > 0 && (
              <span className={styles.statItem}>
                {districtsWithoutSvg.length} готуються
              </span>
            )}
          </p>
        </div>
        
        {/* Основна карта з SVG */}
        {districtsWithSvg.length > 0 ? (
          <div className={styles.mapArea}>
            <div className={styles.mapWrapper}>
              <div className={styles.combinedMap}>
                {districtsWithSvg.map(district => (
                  <DistrictCard
                    key={district.id}
                    district={district}
                    isSelected={selectedDistrict?.id === district.id}
                    onClick={handleDistrictClick}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.noMapContainer}>
            <div className={styles.placeholder}>
              <div className={styles.placeholderIcon}>🗺️</div>
              <h3>Карта районів</h3>
              <p>Для цього міста ще не додані мапи районів</p>
            </div>
          </div>
        )}
      </div>

      {/* Модальне вікно з деталями */}
      <DistrictDetailsModal
        district={selectedDistrict}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
}

// Допоміжні компоненти
const DistrictCard = React.memo(({ district, isSelected, onClick }) => (
  <div
    className={`${styles.districtCard} ${
      isSelected ? styles.selected : ''
    }`}
    onClick={() => onClick(district)}
  >
    <div
      dangerouslySetInnerHTML={{ __html: district.svgContent }}
      className={styles.svgContainer}
    />
    <div className={styles.districtName}>{district.name}</div>
    {district.filterData && (
      <div className={styles.districtStats}>
        <span className={styles.statBadge}>🏫 {district.filterData.education?.rating?.toFixed(1) || 'н/д'}</span>
        <span className={styles.statBadge}>🚍 {district.filterData.transport?.rating?.toFixed(1) || 'н/д'}</span>
        <span className={styles.statBadge}>🛡️ {district.filterData.safety?.rating?.toFixed(1) || 'н/д'}</span>
         <span className={styles.statBadge}>
          🌳 {district.filterData.social?.rating?.toFixed(1) || 'н/д'}
        </span>
        <span className={styles.statBadge}>
          🏥 {district.filterData.medicine?.rating?.toFixed(1) || 'н/д'}
        </span>
        <span className={styles.statBadge}>
          🛒 {district.filterData.commerce?.rating?.toFixed(1) || 'н/д'}
        </span>
        <span className={styles.statBadge}>
            💰 {(district.filterData.general.propertyPrice / 1000).toFixed(0)}к
          </span>
          <span className={styles.statBadge}>
            👥 {(district.filterData.general.populationDensity / 1000).toFixed(1)}к
          </span>

      </div>
    )}
  </div>
));

