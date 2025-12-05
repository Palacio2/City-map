import React, { useState, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import styles from './DistrictsMap.module.css';
import DistrictDetailsModal from './DistrictDetailsModal';

export default function DistrictsMap({ districts, onDistrictClick, selectedFilters = {} }) {
  const { country, city } = useParams();
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const handleDistrictClick = useCallback((district) => {
    setSelectedDistrict(district);
    setIsModalOpen(true);
    onDistrictClick?.(district);
  }, [onDistrictClick]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedDistrict(null);
  }, []);

  const districtsWithPhoto = useMemo(() => 
    districts.filter(d => d.photo_url), [districts]);
  
  const districtsWithoutPhoto = useMemo(() => 
    districts.filter(d => !d.photo_url), [districts]);

  const hasActiveFilters = useMemo(() => 
    Object.keys(selectedFilters).length > 0 && 
    Object.values(selectedFilters).some(filter => 
      filter && Object.keys(filter).length > 0
    ), [selectedFilters]);

  const paginatedDistricts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return districtsWithPhoto.slice(startIndex, endIndex);
  }, [districtsWithPhoto, currentPage]);

  const totalPages = Math.ceil(districtsWithPhoto.length / itemsPerPage);

  return (
    <>
      <div className={styles.mapContainer}>
        <div className={styles.mapHeader}>
          <h1 className={styles.title}>
            {decodeURIComponent(city)}, {decodeURIComponent(country)}
          </h1>
          <h2>Фото районів</h2>
          <div className={styles.mapStats}>
            {districts.length > 0 && (
              <>
                <span className={styles.statItem}>
                  {districtsWithPhoto.length} з {districts.length} районів з фото
                </span>
                {hasActiveFilters && (
                  <span className={styles.activeFilterBadge}>
                    🔍 Застосовані фільтри
                  </span>
                )}
                {districtsWithoutPhoto.length > 0 && (
                  <span className={styles.statItem}>
                    {districtsWithoutPhoto.length} без фото
                  </span>
                )}
              </>
            )}
          </div>
        </div>
        
        {districts.length === 0 ? (
          // Повнорозмірне повідомлення про відсутність даних
          <div className={styles.fullSizeNoData}>
            <div className={styles.placeholder}>
              <div className={styles.placeholderIcon}>
                {hasActiveFilters ? '🔍' : '🏙️'}
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
            </div>
          </div>
        ) : districtsWithPhoto.length > 0 ? (
          // Звичайний вміст з картками
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
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    ←
                  </button>
                  <span>Сторінка {currentPage} з {totalPages}</span>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    →
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Повнорозмірне повідомлення про відсутність фото
          <div className={styles.fullSizeNoData}>
            <div className={styles.placeholder}>
              <div className={styles.placeholderIcon}>🏙️</div>
              <h3>Фото районів</h3>
              <p>Для цього міста ще не додані фото районів</p>
              <div className={styles.availableDistricts}>
                <h4>Доступні райони ({districts.length}):</h4>
                <div className={styles.districtsNameList}>
                  {districts.slice(0, 10).map(district => (
                    <span key={district.id} className={styles.districtNameTag}>
                      {district.name}
                    </span>
                  ))}
                  {districts.length > 10 && (
                    <span className={styles.districtNameTag}>
                      +{districts.length - 10} ще
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <DistrictDetailsModal
  district={selectedDistrict}
  isOpen={isModalOpen}
  onClose={handleCloseModal}
  onToggleFavorite={(districtId, isFavorite) => {
    console.log(`Район ${districtId} ${isFavorite ? 'додано' : 'видалено'} з улюблених`);
  }}
/>
    </>
  );
}

const DistrictCard = React.memo(({ district, isSelected, onClick }) => {
  // Дані вже трансформовані в DistrictMap.jsx
  const filterData = district.filterData;
  
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
        <div className={styles.photoPlaceholder}>
          🏙️
        </div>
      )}
      <div className={styles.districtName}>{district.name}</div>
      {filterData && (
        <div className={styles.districtStats}>
          <span className={styles.statBadge}>🏫 {filterData.education?.rating?.toFixed(1) || 'н/д'}</span>
          <span className={styles.statBadge}>🚍 {filterData.transport?.rating?.toFixed(1) || 'н/д'}</span>
          <span className={styles.statBadge}>🛡️ {filterData.safety?.rating?.toFixed(1) || 'н/д'}</span>
          <span className={styles.statBadge}>🌳 {filterData.social?.rating?.toFixed(1) || 'н/д'}</span>
          <span className={styles.statBadge}>🏥 {filterData.medicine?.rating?.toFixed(1) || 'н/д'}</span>
          <span className={styles.statBadge}>🛒 {filterData.commerce?.rating?.toFixed(1) || 'н/д'}</span>
        </div>
      )}
    </div>
  );
});