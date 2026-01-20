import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FaFire, FaMapMarkerAlt, FaHome, FaKey, FaClock, FaPen } from 'react-icons/fa';
import LocationSelectorModal from './LocationSelectorModal';
import { fetchDistrictsWithFilters } from '../../../api/districtsApi';
import styles from './PopularDistricts.module.css';

const getCurrencyCode = (countryName) => {
  if (!countryName) return 'USD';
  const name = countryName.toLowerCase().trim();
  if (['ukraine', 'україна', 'ua'].includes(name)) return 'UAH';
  if (['poland', 'polska', 'pl'].includes(name)) return 'PLN';
  if (name.includes('germany') || name.includes('france') || name.includes('italy') || name.includes('spain')) return 'EUR';
  return 'USD';
};

const formatPrice = (price, country) => {
  if (!price || price === 0) return 'N/A';
  const currency = getCurrencyCode(country);
  return new Intl.NumberFormat('uk-UA', { 
    style: 'currency', currency, maximumFractionDigits: 0 
  }).format(price);
};

const formatDate = (dateString, defaultText) => {
  if (!dateString) return defaultText;
  return new Date(dateString).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function PopularDistricts() {
  const { t } = useTranslation('stats');
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(false);
  
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
          setDistricts(Array.isArray(data) ? data.slice(0, 5) : []);
        } catch { /* silent */ } 
        finally { setLoading(false); }
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

  const handleNavigate = (district) => {
    if (selectedLocation && district.name) {
      navigate(`/map/${encodeURIComponent(selectedLocation.country)}/${encodeURIComponent(selectedLocation.city)}?district=${encodeURIComponent(district.name)}`);
    }
  };

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <div className={styles.titleWrapper}>
          <FaFire className={styles.icon} />
          <h2 className={styles.title}>
            {selectedLocation 
              ? `${t('popular_in')} ${selectedLocation.city}`
              : t('popular_districts')
            }
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
            <p>{t('select_city_prompt')}</p>
            <button className={styles.mainActionBtn} onClick={() => setIsModalOpen(true)}>
              {t('start_select')}
            </button>
          </div>
        ) : loading ? (
          <div className={styles.loader}>{t('loading')}...</div>
        ) : districts.length > 0 ? (
          <div className={styles.grid}>
            {districts.map((district, index) => {
              const generalStats = district.filterData?.general || {};
              const salePrice = generalStats.salePriceSqm || generalStats.propertyPrice || district.sale_price || district.avg_price_sqm;
              const rentPrice = generalStats.rentalPrice || district.rental_price || district.avg_price_rent;
              const isSalePriceValid = salePrice && salePrice !== 0;

              return (
                <div key={district.id || index} className={styles.richCard} onClick={() => handleNavigate(district)}>
                  <div className={styles.cardTop}>
                      <span className={styles.locationBadge}>
                          <FaMapMarkerAlt /> {selectedLocation.country}, {selectedLocation.city}
                      </span>
                      <span className={styles.rankBadge}>#{index + 1}</span>
                  </div>
                  <h3 className={styles.districtName}>{district.name}</h3>
                  <div className={styles.statsRow}>
                      <div className={styles.statItem}>
                          <div className={styles.statLabel}><FaKey className={styles.rentIcon} /> <span>{t('rent_label')}</span></div>
                          <div className={styles.statValue}>{formatPrice(rentPrice, selectedLocation.country)}</div>
                      </div>
                      <div className={styles.statItem}>
                          <div className={styles.statLabel}><FaHome className={styles.saleIcon} /> <span>{t('sale_label')}</span></div>
                          <div className={styles.statValue}>
                              {formatPrice(salePrice, selectedLocation.country)}
                              {isSalePriceValid && <span className={styles.unit}> / м²</span>}
                          </div>
                      </div>
                  </div>
                  <div className={styles.cardFooter}>
                      <FaClock className={styles.clockIcon} />
                      <span>{t('updated_label')} {formatDate(district.updated_at || district.created_at, t('date_unknown'))}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.emptyState}>{t('no_popular_data')}</div>
        )}
      </div>
      {isModalOpen && <LocationSelectorModal onClose={() => setIsModalOpen(false)} onSubmit={handleLocationSubmit} />}
    </div>
  );
}