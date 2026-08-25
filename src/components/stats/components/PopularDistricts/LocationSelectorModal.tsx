// @ts-nocheck
import React, { useState, useEffect, useRef, useMemo, FormEvent, ChangeEvent } from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import { FaTimes, FaMapMarkerAlt, FaGlobe, FaCity, FaMap } from 'react-icons/fa';
import { fetchCountries, fetchCitiesByCountry } from '@cityCountrySelect/api/cityCountrySelect'; 
import { fetchDistrictsWithFilters } from '@api/districtsApi';
import Loader from '@components/loader/Loader';

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
  const [districts, setDistricts] = useState<any[]>([]);
  
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistricts, setSelectedDistricts] = useState<DistrictSelection[]>([]); 
  
  const [loading, setLoading] = useState({ countries: true, cities: false, districts: false });
  const [error, setError] = useState<string | null>(null);
  const districtsCache = useRef<Record<string, any[]>>({});

  useEffect(() => {
    let isMounted = true;
    fetchCountries()
      .then(data => {
        if (isMounted) {
          setCountries(Array.isArray(data) ? data.map(i => i.value || i) : []);
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

  const handleCountryChange = async (e: ChangeEvent<HTMLSelectElement>) => {
    const country = e.target.value;
    setSelectedCountry(country);
    setSelectedCity(''); 
    setCities([]); 
    setDistricts([]);
    setSelectedDistricts([]);
    if (!country) return;
    setLoading(p => ({ ...p, cities: true }));
    try {
      const data = await fetchCitiesByCountry(country);
      setCities(Array.isArray(data) ? data.map((i: any) => i.value || i) : []);
    } catch (err) { console.error('Error caught in empty catch block:', err); } finally { setLoading(p => ({ ...p, cities: false })); }
  };

  const handleCityChange = async (e: ChangeEvent<HTMLSelectElement>) => {
    const city = e.target.value;
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
        const response = await fetchDistrictsWithFilters(selectedCountry, city, false);
        const allDistricts = Array.isArray(response) ? response : ((response as any)?.districts || (response as any)?.data || []);
        districtsCache.current[cacheKey] = allDistricts;
        setDistricts(allDistricts);
      } catch (err) { console.error('Error caught in empty catch block:', err); } finally { setLoading(p => ({ ...p, districts: false })); }
    }
  };

  const availableDistricts = useMemo(() => {
    return districts.filter(d => {
      const name = d.name || d;
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
    if (includeDistrict && selectedDistricts.length > 0) {
      onSubmit(selectedDistricts); 
    } else if (!includeDistrict && selectedCountry && selectedCity) {
      onSubmit({ country: selectedCountry, city: selectedCity });
    }
  };

  const isFormValid = includeDistrict ? selectedDistricts.length > 0 : (selectedCountry && selectedCity);

  const modalContent = (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[9999] backdrop-blur-sm p-4 animate-fadeIn" onClick={onClose}>
      <div className="bg-body rounded-2xl w-full max-w-[500px] max-h-[90vh] flex flex-col relative shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-borderClient animate-popIn overflow-hidden" onClick={e => e.stopPropagation()}>
        <button type="button" className="absolute top-4 right-4 bg-transparent border-none w-9 h-9 rounded-full flex items-center justify-center cursor-pointer text-textSecondary transition-colors z-10 hover:bg-danger/10 hover:text-danger" onClick={onClose}><FaTimes /></button>
        
        <div className="pt-8 px-6 pb-5 text-center border-b border-borderClient bg-surface shrink-0">
          <div className="w-[60px] h-[60px] bg-hover border border-borderClient rounded-2xl flex items-center justify-center mx-auto mb-4 text-accent text-[26px] shadow-sm">
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
                <select value={selectedCountry} onChange={handleCountryChange} disabled={loading.countries} className="w-full py-3 pl-4 pr-11 bg-surface border border-borderClient rounded-lg text-base text-textMain appearance-none cursor-pointer transition-all focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-hover" required={!includeDistrict}>
                  <option value="">{loading.countries ? t('stats.status.loading') : t('stats.placeholders.select_country')}</option>
                  {countries.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-textSecondary pointer-events-none text-xs">▼</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-[0.85rem] font-bold uppercase tracking-widest text-textSecondary flex items-center gap-2">
                <FaCity className="text-accent"/> {t('stats.labels.city')}
              </label>
              <div className="relative w-full">
                <select value={selectedCity} onChange={handleCityChange} disabled={!selectedCountry || loading.cities} className="w-full py-3 pl-4 pr-11 bg-surface border border-borderClient rounded-lg text-base text-textMain appearance-none cursor-pointer transition-all focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-hover" required={!includeDistrict}>
                  <option value="">{!selectedCountry ? t('stats.status.select_country_first') : loading.cities ? t('stats.status.loading') : t('stats.placeholders.select_city')}</option>
                  {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-textSecondary pointer-events-none text-xs">▼</span>
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
                            {availableDistricts.map((d) => (
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
                                        <button type="button" className="bg-transparent border-none text-accent cursor-pointer p-1 flex items-center rounded transition-colors hover:bg-danger hover:text-white" onClick={() => removeSelectedDistrict(d)}>
                                            <FaTimes />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            <button type="submit" className="mt-auto w-full bg-textMain text-surface border-none py-3.5 rounded-lg font-heading font-semibold uppercase tracking-widest text-[0.95rem] cursor-pointer transition-all hover:not(:disabled):bg-accent disabled:opacity-50 disabled:cursor-not-allowed" disabled={!isFormValid || loading.cities || loading.districts}>
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
