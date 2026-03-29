import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaFire, FaMapMarkerAlt, FaHome, FaKey, FaClock, FaPen } from 'react-icons/fa';
import LocationSelectorModal from './LocationSelectorModal';
import DistrictDetailsModal from '@components/districtMap/DistrictDetailsModal'; 
import { fetchDistrictsWithFilters } from '@api/districtsApi';
import { transformDistrictsForDisplay } from '@utils/dataTransformers';
import { formatPrice } from '@utils/formatters.jsx';

export default function PopularDistricts() {
  const { t, i18n } = useTranslation('db');
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
    if (!dateString) return t('common.general.date_unknown');
    return new Date(dateString).toLocaleDateString(i18n.language || 'uk-UA', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-5 gap-4">
        <div className="flex items-center gap-3">
          <FaFire className="text-danger text-[22px]" />
          <h2 className="text-[1.25rem] font-bold font-heading text-textMain m-0">
            {selectedLocation ? `${t('stats.popular_in')} ${selectedLocation.city}` : t('stats.popular_districts')}
          </h2>
        </div>
        {selectedLocation && (
          <button className="bg-transparent border border-borderClient w-10 h-10 rounded flex items-center justify-center cursor-pointer text-textSecondary transition-all hover:bg-hover hover:text-accent hover:border-accent" onClick={() => setIsModalOpen(true)}>
            <FaPen />
          </button>
        )}
      </div>

      <div className="min-h-[100px] w-full">
        {!selectedLocation ? (
          <div className="text-center p-10 bg-body rounded-lg text-textSecondary border-2 border-dashed border-borderClient flex flex-col items-center gap-4">
            <p>{t('stats.select_city_prompt')}</p>
            <button className="bg-textMain text-surface border-none py-3 px-6 rounded-md font-semibold font-heading uppercase tracking-widest cursor-pointer transition-all hover:bg-accent hover:-translate-y-0.5" onClick={() => setIsModalOpen(true)}>
              {t('stats.start_select')}
            </button>
          </div>
        ) : loading ? (
          <div className="text-center p-10 bg-body rounded-lg text-textSecondary border-2 border-dashed border-borderClient">{t('common.general.loading')}</div>
        ) : districts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
            {districts.map((district, index) => {
              const salePrice = district.filterData?.utilities?.propertyPricePerSqm || district.sale_price;
              const rentPrice = district.filterData?.general?.average_rent_price || district.rental_price;
              
              return (
                <div key={district.id || index} className="bg-body border border-borderClient rounded-lg p-5 cursor-pointer flex flex-col transition-all relative hover:-translate-y-1 hover:border-accent hover:shadow-hover" onClick={() => handleCardClick(district)}>
                  <div className="flex justify-between items-start mb-3">
                      <span className="text-[0.75rem] font-semibold text-textSecondary bg-surface px-2 py-1 rounded inline-flex items-center gap-1.5 border border-borderClient">
                          <FaMapMarkerAlt /> {selectedLocation.country}, {selectedLocation.city}
                      </span>
                      <span className="bg-danger/10 text-danger font-extrabold text-[0.8rem] px-2 py-1 rounded">#{index + 1}</span>
                  </div>
                  <h3 className="text-[1.15rem] font-bold font-heading text-textMain m-0 mb-4">{district.name}</h3>
                  <div className="flex gap-3 mb-4 pb-4 border-b border-borderClient">
                      <div className="flex-1 flex flex-col gap-1">
                          <div className="text-[0.7rem] uppercase tracking-widest text-textSecondary font-semibold flex gap-1.5 items-center"><FaKey className="text-accent" /> <span>{t('common.fields.average_rent_price')}</span></div>
                          <div className="text-base font-bold font-heading text-textMain">{formatPrice(rentPrice, selectedLocation.country)}</div>
                      </div>
                      <div className="flex-1 flex flex-col gap-1">
                          <div className="text-[0.7rem] uppercase tracking-widest text-textSecondary font-semibold flex gap-1.5 items-center"><FaHome className="text-textMain" /> <span>{t('common.fields.propertyPricePerSqm')}</span></div>
                          <div className="text-base font-bold font-heading text-textMain">
                              {formatPrice(salePrice, selectedLocation.country)}
                              {salePrice ? <span className="text-[0.75rem] text-textSecondary font-normal"> / м²</span> : null}
                          </div>
                      </div>
                  </div>
                  <div className="mt-auto flex items-center gap-2 text-[0.75rem] text-textSecondary">
                      <FaClock />
                      <span>{t('stats.updated_label')} {formatDate(district.updated_at)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center p-10 bg-body rounded-lg text-textSecondary border-2 border-dashed border-borderClient">{t('stats.no_popular_data')}</div>
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