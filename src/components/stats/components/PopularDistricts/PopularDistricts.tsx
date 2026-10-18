import { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaHome, FaClock } from 'react-icons/fa';
import LocationSelectorModal from './LocationSelectorModal';
import DistrictDetailsModal from '@pages/districtMap/components/DistrictDetailsModal'; 
import { fetchDistrictsWithFilters } from '@api/districtsApi';
import { transformDistrictsForDisplay, TransformedDistrict } from '@utils/dataTransformers';
import { useFormat } from '@hooks/useFormat';
import { useFiltersConfig } from '@hooks/useFiltersConfig';
import { useSubscription } from '@/pages/subscription/context/SubscriptionContext';
import { STORAGE_KEYS } from '@config/constants';

interface SelectedLocation {
  country: string;
  city: string;
}

export default function PopularDistricts() {
  const { t, formatPrice, getCurrencyInfo, formatDate } = useFormat();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [districts, setDistricts] = useState<TransformedDistrict[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewingDistrict, setViewingDistrict] = useState<TransformedDistrict | null>(null);
  
  const { config } = useFiltersConfig();
  const { isFree, isRealtor } = useSubscription();

  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SELECTED_LOCATION);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const loadData = async () => {
      if (
        !selectedLocation?.country || 
        !selectedLocation?.city || 
        selectedLocation.country === 'undefined' || 
        selectedLocation.city === 'undefined' ||
        !config
      ) {
        return;
      }

      setLoading(true);
      try {
        const data = await fetchDistrictsWithFilters(selectedLocation.country, selectedLocation.city);
        const transformed = transformDistrictsForDisplay(data, config, { isFree, isRealtor });
        
        setDistricts(transformed.slice(0, 4));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedLocation, config, isFree, isRealtor]);

  const handleLocationSubmit = (location: SelectedLocation) => {
    setSelectedLocation(location);
    try {
      localStorage.setItem(STORAGE_KEYS.SELECTED_LOCATION, JSON.stringify(location));
    } catch {
      // Ignore quota/private browsing errors
    }
    setIsModalOpen(false);
  };

  return (
    <div className="mb-4">
      <div className="flex justify-end mb-6">
        <button className="bg-surface text-textMain border border-borderClient px-4 py-2 rounded-lg font-semibold text-sm cursor-pointer transition-all font-heading uppercase tracking-widest hover:bg-hover hover:border-accent dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10" onClick={() => setIsModalOpen(true)}>
          {selectedLocation ? `${selectedLocation.city}, ${selectedLocation.country}` : t('stats.actions.select_city')}
        </button>
      </div>
      
      <div className="min-h-[200px]">
        {loading || !config ? (
          <div className="flex justify-center items-center h-[200px] text-accent">
            <div className="w-8 h-8 border-4 border-t-accent border-borderClient rounded-full animate-spin"></div>
          </div>
        ) : districts.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
            {districts.map(district => {
              const salePrice = district.filterData?.general.propertyPrice;
              
              return (
                <div key={district.id} className="bg-surface rounded-2xl p-3 sm:p-5 flex flex-col gap-3 sm:gap-4 border border-borderClient transition-all shadow-xs hover:shadow-md hover:border-accent dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10 dark:hover:border-accent dark:hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] group cursor-pointer" onClick={() => setViewingDistrict(district)}>
                  <div className="flex flex-row gap-3 sm:gap-4 items-center border-b border-borderClient pb-3 sm:pb-4 dark:border-white/10">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-body overflow-hidden shrink-0 border border-borderClient dark:border-white/10">
                      {district.photo_url ? <img src={district.photo_url} alt={district.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl bg-hover dark:bg-white/5">🏙️</div>}
                    </div>
                    <div className="min-w-0">
                      <h3 className="m-0 font-heading text-base sm:text-lg font-bold text-textMain truncate">{district.name}</h3>
                      <div className="text-[0.7rem] sm:text-[0.8rem] text-textSecondary flex items-center gap-1 mt-0.5 sm:mt-1 truncate"><FaMapMarkerAlt className="shrink-0" /> <span className="truncate">{selectedLocation?.city}</span></div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                      <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center bg-body dark:bg-transparent p-2.5 sm:p-3 rounded-lg border border-borderClient dark:border-white/10 gap-1.5 sm:gap-0">
                          <div className="text-[0.65rem] sm:text-[0.75rem] uppercase tracking-widest text-textSecondary font-semibold flex gap-1.5 items-center"><FaHome className="text-textMain shrink-0" /> <span className="truncate">{t('common.fields.propertyPricePerSqm')}</span></div>
                          <div className="text-sm sm:text-base font-bold font-heading text-textMain whitespace-nowrap">
                              {formatPrice(salePrice, getCurrencyInfo(selectedLocation?.country))}
                          </div>
                      </div>
                  </div>
                  <div className="mt-auto pt-2 flex items-center justify-between text-[0.75rem] text-textSecondary">
                      <span className="flex items-center gap-1.5"><FaClock /> {t('stats.labels.updated')} {formatDate(district.updated_at, { year: 'numeric', month: 'short', day: 'numeric' }, '-')}</span>
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

      <DistrictDetailsModal 
        district={viewingDistrict}
        selectedCategory={null}
        isOpen={!!viewingDistrict}
        onClose={() => setViewingDistrict(null)}
      />
    </div>
  );
}

