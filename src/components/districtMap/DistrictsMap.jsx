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

  if (districts.length === 0) {
    return (
      <div className={styles.noDataContainer}>
        <div className={styles.placeholder}>
          <div className={styles.placeholderIcon}>🗺️</div>
          <h3>Райони не знайдені</h3>
          <p>Для цього міста ще не додані райони</p>
        </div>
      </div>
    );
  }

  if (districtsWithSvg.length === 0) {
    return (
      <div className={styles.noMapContainer}>
        <div className={styles.placeholder}>
          <div className={styles.placeholderIcon}>🗺️</div>
          <h3>Карта районів</h3>
          <p>Для цього міста ще не додані мапи районів</p>
          <div className={styles.availableDistricts}>
            <h4>Доступні райони ({districtsWithoutSvg.length}):</h4>
            <div className={styles.districtsNameList}>
              {districtsWithoutSvg.map(district => (
                <span key={district.id} className={styles.districtNameTag}>
                  {district.name}
                </span>
              ))}
            </div>
          </div>
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
            {districtsWithoutSvg.length > 0 && (
              <span className={styles.statItem}>
                {districtsWithoutSvg.length} готуються
              </span>
            )}
          </p>
        </div>
        
        {/* Основна карта з SVG */}
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

        {/* Список всіх районів */}
        <DistrictList 
          districts={districts}
          selectedDistrict={selectedDistrict}
          onDistrictClick={handleDistrictClick}
        />
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

// Допоміжні компоненти (залишаються незмінними)
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
      </div>
    )}
  </div>
));

const DistrictList = React.memo(({ districts, selectedDistrict, onDistrictClick }) => (
  <div className={styles.districtsList}>
    <h4>Всі райони міста ({districts.length}):</h4>
    <div className={styles.listGrid}>
      {districts.map(district => (
        <div
          key={district.id}
          className={`${styles.listItem} ${
            district.svgContent ? styles.hasMap : styles.noMap
          } ${selectedDistrict?.id === district.id ? styles.selected : ''}`}
          onClick={() => district.svgContent && onDistrictClick(district)}
          title={district.svgContent ? `Переглянути мапу ${district.name}` : 'Мапа готується'}
        >
          <span className={styles.listItemName}>{district.name}</span>
          {district.filterData && (
            <div className={styles.listItemStats}>
              <span>🏫 {district.filterData.education?.rating?.toFixed(1) || '-'}</span>
              <span>🚍 {district.filterData.transport?.rating?.toFixed(1) || '-'}</span>
              <span>🛡️ {district.filterData.safety?.rating?.toFixed(1) || '-'}</span>
            </div>
          )}
          {!district.svgContent && (
            <span className={styles.comingSoon}> (готується)</span>
          )}
        </div>
      ))}
    </div>
  </div>
));