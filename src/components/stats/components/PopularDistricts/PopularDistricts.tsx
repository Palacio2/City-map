import { useState, useEffect } from 'react'; // Виправлено: видалено React
import { useTranslation } from 'react-i18next';
import { FaMapMarkerAlt, FaHome, FaClock } from 'react-icons/fa';
import LocationSelectorModal from './LocationSelectorModal';
import DistrictDetailsModal from '@components/districtMap/DistrictDetailsModal'; 
import { fetchDistrictsWithFilters } from '@api/districtsApi';
import { transformDistrictsForDisplay, TransformedDistrict } from '@utils/dataTransformers';
import { formatPrice, getCurrencyInfo } from '@utils/formatters'; // Виправлено: додано getCurrencyInfo
import { useFiltersConfig } from '@hooks/useFiltersConfig';
import { useSubscription } from '@subscription/SubscriptionContext';

interface SelectedLocation {
  country: string;
  city: string;
}

export default function PopularDistricts() {
  const { t } = useTranslation('db');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [districts, setDistricts] = useState<TransformedDistrict[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewingDistrict, setViewingDistrict] = useState<TransformedDistrict | null>(null);
  
  const { config } = useFiltersConfig();
  const { isFree, isRealtor } = useSubscription();

  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(() => {
    try {
      const saved = localStorage.getItem('popular_districts_location');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  useEffect(() => {
    if (selectedLocation && config) {
      const loadData = async () => {
        setLoading(true);
        try {
          const data = await fetchDistrictsWithFilters(selectedLocation.country, selectedLocation.city);
          const transformed = transformDistrictsForDisplay(data, config, { isFree, isRealtor });
          
          const popular = transformed.slice(0, 6);
          setDistricts(popular);
        } catch (err) {
          console.error("Error loading popular districts", err);
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }
  }, [selectedLocation, config, isFree, isRealtor]);

  const handleLocationSubmit = (loc: SelectedLocation[]) => {
    if (loc && loc.length > 0) {
       const selection = { country: loc[0].country, city: loc[0].city };
       setSelectedLocation(selection);
       localStorage.setItem('popular_districts_location', JSON.stringify(selection));
    }
    setIsModalOpen(false);
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('uk-UA');
  };

  return (
    <div className="mb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="m-0 font-heading text-2xl font-bold text-textMain">
          {t('stats.popular_districts.title')}
        </h2>
        <button className="ui-button-outline !py-2 !px-4 text-[0.85rem]" onClick={() => setIsModalOpen(true)}>
          {selectedLocation ? `${selectedLocation.city}, ${selectedLocation.country}` : t('stats.actions.select_city')}
        </button>
      </div>
      
      <div className="min-h-[200px]">
        {loading || !config ? (
          <div className="flex justify-center items-center h-[200px] text-accent"><div className="w-8 h-8 border-4 border-t-accent border-borderClient rounded-full animate-spin"></div></div>
        ) : districts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {districts.map(district => {
              const salePrice = (district.filterData?.general as any)?.propertyPrice?.value ?? (district.filterData?.general as any)?.propertyPrice;
              
              return (
                <div key={district.id} className="bg-surface border border-borderClient rounded-xl p-5 flex flex-col gap-4 cursor-pointer hover:border-accent hover:-translate-y-1 hover:shadow-hover transition-all" onClick={() => setViewingDistrict(district)}>
                  <div className="flex gap-4 items-center border-b border-borderClient pb-4">
                    <div className="w-14 h-14 rounded-lg bg-body overflow-hidden shrink-0 border border-borderClient">
                      {district.photo_url ? <img src={district.photo_url} alt={district.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl bg-hover">🏙️</div>}
                    </div>
                    <div>
                      <h3 className="m-0 font-heading text-lg font-bold text-textMain">{district.name}</h3>
                      <div className="text-[0.8rem] text-textSecondary flex items-center gap-1.5 mt-1"><FaMapMarkerAlt /> {selectedLocation?.city}</div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-center bg-body p-3 rounded-lg border border-borderClient">
                          <div className="text-[0.75rem] uppercase tracking-widest text-textSecondary font-semibold flex gap-1.5 items-center"><FaHome className="text-textMain" /> <span>{t('common.fields.propertyPricePerSqm')}</span></div>
                          <div className="text-base font-bold font-heading text-textMain">
                              {/* Виправлено: передаємо результат getCurrencyInfo */}
                              {formatPrice(salePrice, getCurrencyInfo(selectedLocation?.country))}
                          </div>
                      </div>
                  </div>
                  <div className="mt-auto pt-2 flex items-center justify-between text-[0.75rem] text-textSecondary">
                      <span className="flex items-center gap-1.5"><FaClock /> {t('stats.labels.updated')} {formatDate(district.updated_at)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center p-10 bg-body rounded-lg text-textSecondary border-2 border-dashed border-borderClient">{t('stats.popular_districts.empty')}</div>
        )}
      </div>
      
      {isModalOpen && <LocationSelectorModal onClose={() => setIsModalOpen(false)} onSubmit={handleLocationSubmit} />}

      {viewingDistrict && (
        <DistrictDetailsModal 
          district={viewingDistrict}
          selectedCategory={null}
          isOpen={true}
          onClose={() => setViewingDistrict(null)}
        />
      )}
    </div>
  );
}