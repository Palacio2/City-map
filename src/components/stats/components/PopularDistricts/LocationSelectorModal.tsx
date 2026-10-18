/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useMemo, FormEvent } from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import { FaTimes, FaMapMarkerAlt, FaGlobe, FaCity, FaMap } from 'react-icons/fa';
import { fetchCountries, fetchCitiesByCountry } from '@cityCountrySelect/api/cityCountryApi'; 
import { fetchDistrictsWithFilters } from '@api/districtsApi';
import type { DistrictData } from '@shared/types/district.types';
import Loader from '@components/loader/Loader';
import { CustomSelect } from '../../../../pages/admin/core/ui/CustomSelect';

export interface DistrictSelection {
  id?: string | number;
  name: string;
  city: string;
  country: string;
  [key: string]: any;
}

export interface LocationSelectorModalProps {
  onClose: () => void;
  onSubmit: (...args: any[]) => void;
  includeDistrict?: boolean;
  trackedLocations?: any[];
  maxSelection?: number | null;
  currentCount?: number;
}

export default function LocationSelectorModal({ 
  onClose, 
  onSubmit, 
  includeDistrict = false, 
  trackedLocations = [],
  maxSelection = null,
  currentCount = 0 
}: LocationSelectorModalProps) {
  const { t } = useTranslation('db');
  
  const [countries, setCountries] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [districts, setDistricts] = useState<DistrictData[]>([]);
  
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistricts, setSelectedDistricts] = useState<DistrictSelection[]>([]); 
  
  const [loading, setLoading] = useState({ countries: true, cities: false, districts: false });
  const [error, setError] = useState<string | null>(null);
  const districtsCache = useRef<Record<string, DistrictData[]>>({});

  useEffect(() => {
    let isMounted = true;
    fetchCountries()
      .then(data => {
        if (isMounted) {
          setCountries(Array.isArray(data) ? data.map(i => i.value) : []);
          setLoading(p => ({ ...p, countries: false }));
        }
      })
      .catch(() => {
        if (isMounted) {
          setError(t('stats.errors.load_failed')); 
          setLoading(p => ({ ...p, countries: false }));
        }
      });
    return () => { isMounted = false; };
  }, [t]);

  const handleCountryChange = async (value: string | number) => {
    const country = value as string;
    setSelectedCountry(country);
    setSelectedCity(''); 
    setCities([]); 
    setDistricts([]);
    setSelectedDistricts([]);
    if (!country) return;
    setLoading(p => ({ ...p, cities: true }));
    try {
      const data = await fetchCitiesByCountry(country);
      setCities(Array.isArray(data) ? data.map(i => i.value) : []);
    } catch (err) { console.error('Error caught in empty catch block:', err); } finally { setLoading(p => ({ ...p, cities: false })); }
  };

  const handleCityChange = async (value: string | number) => {
    const city = value as string;
    setSelectedCity(city);
    setDistricts([]); 
    if (includeDistrict && city && selectedCountry) {
      setLoading(p => ({ ...p, districts: true }));
      const cacheKey = `${selectedCountry}_${city}`;
      if (districtsCache.current[cacheKey]) {
        setDistricts(districtsCache.current[cacheKey]);
        setLoading(p => ({ ...p, districts: false }));
        return;
      }
      try {
        const response = await fetchDistrictsWithFilters(selectedCountry, city);
        const allDistricts = response;
        districtsCache.current[cacheKey] = allDistricts;
        setDistricts(allDistricts);
      } catch (err) { console.error('Error caught in empty catch block:', err); } finally { setLoading(p => ({ ...p, districts: false })); }
    }
  };

  const availableDistricts = useMemo(() => {
    return districts.filter(d => {
      const name = (d as any).name || d;
      const isSelectedLocally = selectedDistricts.some(sd => sd.name === name && sd.city === selectedCity);
      const isAlreadyTracked = trackedLocations.some(t => t.country === selectedCountry && t.city === selectedCity && (t.district === name || t.name === name));
      return !isSelectedLocally && !isAlreadyTracked;
    });
  }, [districts, selectedDistricts, trackedLocations, selectedCountry, selectedCity]);

  const addDistrict = (districtData: any) => {
    if (maxSelection !== null && (currentCount + selectedDistricts.length >= maxSelection)) {
      alert(t('stats.errors.limit_reached', { max: maxSelection }));
      return;
    }
    const newDistrict: DistrictSelection = {
      ...(typeof districtData === 'object' ? districtData : {}), 
      name: districtData.name || districtData,
      city: selectedCity,
      country: selectedCountry
    };
    setSelectedDistricts(prev => [...prev, newDistrict]);
  };

  const removeSelectedDistrict = (districtToRemove: DistrictSelection) => {
      setSelectedDistricts(prev => prev.filter(d => 
          !(d.name === districtToRemove.name && d.city === districtToRemove.city)
      ));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsClosing(true);
    setTimeout(() => {
      if (includeDistrict && selectedDistricts.length > 0) {
        onSubmit(selectedDistricts); 
      } else if (!includeDistrict && selectedCountry && selectedCity) {
        onSubmit({ country: selectedCountry, city: selectedCity });
      }
    }, 400);
  };

  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 400); // wait for 0.4s animation
  };

  const isFormValid = includeDistrict ? selectedDistricts.length > 0 : (selectedCountry && selectedCity);

  const countryOptions = useMemo(() => {
    const options = countries.map(c => ({ value: c, label: c }));
    return [{ value: '', label: loading.countries ? t('stats.status.loading') : t('stats.placeholders.select_country') }, ...options];
  }, [countries, loading.countries, t]);

  const cityOptions = useMemo(() => {
    const options = cities.map(c => ({ value: c, label: c }));
    return [{ value: '', label: !selectedCountry ? t('stats.status.select_country_first') : loading.cities ? t('stats.status.loading') : t('stats.placeholders.select_city') }, ...options];
  }, [cities, selectedCountry, loading.cities, t]);

  const modalContent = (
    <div className={`fixed inset-0 bg-black/75 flex items-end sm:items-center justify-center z-[9999] backdrop-blur-xs p-0 sm:p-4 ${isClosing ? 'animate-fade-out-custom' : 'animate-fadeIn'}`} onClick={handleClose}>
      <div className={`bg-body w-full max-w-[500px] max-h-[90vh] sm:max-h-[85vh] flex flex-col relative shadow-[0_-10px_40px_rgba(0,0,0,0.3)] sm:shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-borderClient overflow-hidden rounded-t-[32px] sm:rounded-2xl ${isClosing ? 'animate-slide-down-sheet sm:animate-widget-desktop-exit' : 'animate-slide-up-sheet sm:animate-widget-desktop-enter'}`} onClick={e => e.stopPropagation()}>
        <button type="button" className="absolute top-4 right-4 bg-transparent border-none w-9 h-9 rounded-full flex items-center justify-center cursor-pointer text-textSecondary transition-colors z-10 hover:bg-danger/10 hover:text-danger" onClick={handleClose}><FaTimes /></button>
        
        <div className="pt-8 px-6 pb-5 text-center border-b border-borderClient bg-surface shrink-0 relative">
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-borderClient/80 rounded-full sm:hidden" />
          <div className="w-[60px] h-[60px] bg-hover border border-borderClient rounded-2xl flex items-center justify-center mx-auto mb-4 text-accent text-[26px] shadow-xs">
            <FaMapMarkerAlt />
          </div>
          <h3 className="text-[1.5rem] font-heading font-bold text-textMain m-0 mb-2">{includeDistrict ? t('stats.modals.select_location.title_add') : t('stats.modals.select_location.title_select')}</h3>
          <p className="text-textSecondary m-0 text-[0.95rem] leading-relaxed">
            {includeDistrict ? t('stats.modals.select_location.subtitle_add') : t('stats.modals.select_location.subtitle_select')}
          </p>
        </div>

        {error ? <div className="p-6 text-center text-danger font-medium">{error}</div> : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 custom-scrollbar">
            <div className="flex flex-col gap-2">
              <label className="text-[0.85rem] font-bold uppercase tracking-widest text-textSecondary flex items-center gap-2">
                <FaGlobe className="text-accent"/> {t('stats.labels.country')}
              </label>
              <div className="relative w-full">
                <CustomSelect
                  value={selectedCountry}
                  onChange={handleCountryChange}
                  options={countryOptions}
                  disabled={loading.countries}
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-[0.85rem] font-bold uppercase tracking-widest text-textSecondary flex items-center gap-2">
                <FaCity className="text-accent"/> {t('stats.labels.city')}
              </label>
              <div className="relative w-full">
                <CustomSelect
                  value={selectedCity}
                  onChange={handleCityChange}
                  options={cityOptions}
                  disabled={!selectedCountry || loading.cities}
                  className="w-full"
                />
              </div>
            </div>
            
            {includeDistrict && (
                <>
                    <div className="flex flex-col gap-2">
                      <label className="text-[0.85rem] font-bold uppercase tracking-widest text-textSecondary flex items-center gap-2">
                        <FaMap className="text-accent"/> {t('stats.labels.districts')}
                      </label>
                      
                      {!selectedCity ? (
                          <div className="text-center py-6 text-textSecondary text-[0.95rem] bg-hover rounded-lg border border-dashed border-borderClient">{t('stats.status.select_city_first')}</div>
                      ) : loading.districts ? (
                          <div className="text-center py-6 text-textSecondary text-[0.95rem] bg-hover rounded-lg border border-dashed border-borderClient flex justify-center"><Loader size="small" /></div>
                      ) : availableDistricts.length === 0 ? (
                          <div className="text-center py-6 text-textSecondary text-[0.95rem] bg-hover rounded-lg border border-dashed border-borderClient">{t('stats.status.all_added')}</div>
                      ) : (
                          <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto p-1 custom-scrollbar">
                            {availableDistricts.map((d: any) => (
                              <div key={d.id || d.name || d} className="px-3.5 py-2 rounded-full border border-borderClient bg-surface text-textMain text-[0.9rem] cursor-pointer transition-all hover:border-accent hover:text-accent hover:bg-hover" onClick={() => addDistrict(d)}>
                                  {d.name || d}
                              </div>
                            ))}
                          </div>
                      )}
                    </div>

                    {selectedDistricts.length > 0 && (
                        <div className="border-t border-dashed border-borderClient pt-4 mt-2">
                            <h4 className="text-[0.8rem] uppercase text-textSecondary m-0 mb-3 font-bold">{t('stats.labels.selected_count')} ({selectedDistricts.length})</h4>
                            <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto custom-scrollbar">
                                {selectedDistricts.map((d) => (
                                    <div key={d.id || `${d.country}-${d.city}-${d.name}`} className="flex items-center gap-2 bg-accent/10 text-accent py-1.5 px-3 rounded-md text-[0.85rem] font-semibold border border-accent/30">
                                        <span>{d.name} <small className="text-textSecondary font-normal">({d.city})</small></span>
                                        <button type="button" className="bg-transparent border-none text-accent cursor-pointer p-1 flex items-center rounded-sm transition-colors hover:bg-danger hover:text-white" onClick={() => removeSelectedDistrict(d)}>
                                            <FaTimes />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            <button type="submit" className="mt-auto w-full bg-textMain text-surface border-none py-3.5 rounded-lg font-heading font-semibold uppercase tracking-widest text-[0.95rem] cursor-pointer transition-all hover:not-disabled:bg-accent disabled:opacity-50 disabled:cursor-not-allowed" disabled={!isFormValid || loading.cities || loading.districts}>
              {includeDistrict 
                ? `${t('stats.actions.add_selected')} (+${selectedDistricts.length})` 
                : t('stats.actions.show_popular')}
            </button>
          </form>
        )}
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}
