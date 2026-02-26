import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaFire, FaMapMarkerAlt, FaHome, FaKey, FaClock, FaPen } from 'react-icons/fa';
import LocationSelectorModal from './LocationSelectorModal';
import DistrictDetailsModal from '@components/districtMap/DistrictDetailsModal'; 
import { fetchDistrictsWithFilters } from '@api/districtsApi';
import { transformDistrictsForDisplay } from '@utils/dataTransformers';
import { formatPrice } from '@utils/formatters.jsx';
import styles from './PopularDistricts.module.css';

export default function PopularDistricts() {
  const { t, i18n } = useTranslation(['stats', 'common']);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewingDistrict, setViewingDistrict] = useState(null);
  
  const [selectedLocation, setSelectedLocation] = useState(() => {
    try {
      const saved = localStorage.getItem('popular_districts_location');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  useEffect(() => {
    if (selectedLocation) {
      const loadData = async () => {
        setLoading(true);
        try {
          const data = await fetchDistrictsWithFilters(selectedLocation.country, selectedLocation.city);
          const transformedData = transformDistrictsForDisplay(data);
          setDistricts(Array.isArray(transformedData) ? transformedData.slice(0, 5) : []);
        } catch { 
          setDistricts([]);
        } finally { 
          setLoading(false); 
        }
      };
      loadData();
    }
  }, [selectedLocation]);

  const handleLocationSubmit = (country, city) => {
    const newLocation = { country, city };
    setSelectedLocation(newLocation);
    localStorage.setItem('popular_districts_location', JSON.stringify(newLocation));
    setIsModalOpen(false);
  };

  const handleCardClick = (district) => {
    if (district) {
      setViewingDistrict({ ...district, country: selectedLocation?.country, city: selectedLocation?.city });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return t('common:general.date_unknown');
    return new Date(dateString).toLocaleDateString(i18n.language || 'uk-UA', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <div className={styles.titleWrapper}>
          <FaFire className={styles.icon} />
          <h2 className={styles.title}>
            {selectedLocation ? `${t('stats:popular_in')} ${selectedLocation.city}` : t('stats:popular_districts')}
          </h2>
        </div>
        {selectedLocation && (
          <button className={styles.editButton} onClick={() => setIsModalOpen(true)}>
            <FaPen />
          </button>
        )}
      </div>

      <div className={styles.contentArea}>
        {!selectedLocation ? (
          <div className={styles.placeholderState}>
            <p>{t('stats:select_city_prompt')}</p>
            <button className={styles.mainActionBtn} onClick={() => setIsModalOpen(true)}>
              {t('stats:start_select')}
            </button>
          </div>
        ) : loading ? (
          <div className={styles.placeholderState}>{t('common:general.loading')}</div>
        ) : districts.length > 0 ? (
          <div className={styles.grid}>
            {districts.map((district, index) => {
              const salePrice = district.filterData?.utilities?.propertyPricePerSqm || district.sale_price;
              const rentPrice = district.filterData?.general?.average_rent_price || district.rental_price;
              
              return (
                <div key={district.id || index} className={styles.richCard} onClick={() => handleCardClick(district)}>
                  <div className={styles.cardTop}>
                      <span className={styles.locationBadge}>
                          <FaMapMarkerAlt /> {selectedLocation.country}, {selectedLocation.city}
                      </span>
                      <span className={styles.rankBadge}>#{index + 1}</span>
                  </div>
                  <h3 className={styles.districtName}>{district.name}</h3>
                  <div className={styles.statsRow}>
                      <div className={styles.statItem}>
                          <div className={styles.statLabel}><FaKey className={styles.rentIcon} /> <span>{t('common:fields.average_rent_price')}</span></div>
                          <div className={styles.statValue}>{formatPrice(rentPrice, selectedLocation.country)}</div>
                      </div>
                      <div className={styles.statItem}>
                          <div className={styles.statLabel}><FaHome className={styles.saleIcon} /> <span>{t('common:fields.propertyPricePerSqm')}</span></div>
                          <div className={styles.statValue}>
                              {formatPrice(salePrice, selectedLocation.country)}
                              {salePrice ? <span className={styles.unit}> / м²</span> : null}
                          </div>
                      </div>
                  </div>
                  <div className={styles.cardFooter}>
                      <FaClock className={styles.clockIcon} />
                      <span>{t('stats:updated_label')} {formatDate(district.updated_at)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.placeholderState}>{t('stats:no_popular_data')}</div>
        )}
      </div>
      
      {isModalOpen && <LocationSelectorModal onClose={() => setIsModalOpen(false)} onSubmit={handleLocationSubmit} />}

      {viewingDistrict && (
        <DistrictDetailsModal 
          district={viewingDistrict}
          isOpen={true}
          onClose={() => setViewingDistrict(null)}
        />
      )}
    </div>
  );
}