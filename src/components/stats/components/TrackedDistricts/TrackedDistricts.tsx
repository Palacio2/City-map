import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FaBookmark, FaKey, FaHome, FaArrowRight, FaTrash, FaChevronLeft, FaChevronRight, FaPlus, FaClock } from 'react-icons/fa';
import { fetchTrackedDistrictsWithStats, removeTrackedDistrict, addTrackedDistrict } from '@api/trackedDistrictsApi';
import { formatPrice, getCurrencyInfo } from '@utils/formatters'; // Виправлено: додано getCurrencyInfo
import LocationSelectorModal, { DistrictSelection } from '../PopularDistricts/LocationSelectorModal';
import ConfirmationModal from './ConfirmationModal';

const ITEMS_PER_PAGE = 3;
const STORAGE_KEY_PAGE = 'tracked_districts_page';
const STORAGE_KEY_DATA = 'tracked_districts_data';

export interface TrackedDistrict {
  id: string;
  country: string;
  city: string;
  district: string;
  rental_price?: number;
  avg_price_rent?: number;
  sale_price?: number;
  avg_price_sqm?: number;
  updated_at?: string;
  created_at?: string;
}

const formatDate = (dateString: string | undefined, defaultText: string) => {
  if (!dateString) return defaultText;
  return new Date(dateString).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' });
};

interface TrackedDistrictsProps {
  districts?: TrackedDistrict[];
}

export default function TrackedDistricts({ districts: initialDistricts }: TrackedDistrictsProps) {
  const { t } = useTranslation('db');
  const navigate = useNavigate();
  
  const [trackedItems, setTrackedItems] = useState<TrackedDistrict[]>(() => {
    if (initialDistricts && initialDistricts.length > 0) return initialDistricts;
    try {
      const cached = sessionStorage.getItem(STORAGE_KEY_DATA);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState<boolean>(() => trackedItems.length === 0);
  const [currentPage, setCurrentPage] = useState<number>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY_PAGE);
      return saved ? Number(saved) : 0;
    } catch {
      return 0;
    }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [districtToDelete, setDistrictToDelete] = useState<string | null>(null);

  const updateLocalData = useCallback((newData: TrackedDistrict[]) => {
    setTrackedItems(newData);
    sessionStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(newData));
  }, []);

  const loadTrackedData = useCallback(async () => {
    if (trackedItems.length === 0) setLoading(true);
    try {
      const data = await fetchTrackedDistrictsWithStats();
      updateLocalData(data as TrackedDistrict[]);
      const maxPage = Math.ceil(data.length / ITEMS_PER_PAGE) - 1;
      if (currentPage > maxPage && maxPage >= 0) setCurrentPage(maxPage);
    } catch (err) { 
      console.error(err);
    } finally { 
      setLoading(false); 
    }
  }, [trackedItems.length, updateLocalData, currentPage]);

  useEffect(() => { 
    loadTrackedData(); 
  }, [loadTrackedData]);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY_PAGE, String(currentPage));
  }, [currentPage]);

  const handleNavigate = (item: TrackedDistrict) => {
    if (item.city && item.country && item.district) {
       navigate(`/map/${encodeURIComponent(item.country)}/${encodeURIComponent(item.city)}?district=${encodeURIComponent(item.district)}`);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDistrictToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!districtToDelete) return;
    try {
      await removeTrackedDistrict(districtToDelete);
      const newItems = trackedItems.filter(item => item.id !== districtToDelete);
      updateLocalData(newItems);
      const maxPage = Math.ceil(newItems.length / ITEMS_PER_PAGE) - 1;
      if (currentPage > maxPage && maxPage >= 0) setCurrentPage(maxPage);
    } catch {
      alert(t('stats.errors.delete_failed'));
    } finally {
      setDeleteModalOpen(false);
      setDistrictToDelete(null);
    }
  };

  const handleAddSubmit = async (districtsArray: DistrictSelection[]) => {
    if (!districtsArray || districtsArray.length === 0) return;
    setIsAdding(true);
    try {
        const promises = districtsArray.map(d => 
            addTrackedDistrict({ country: d.country, city: d.city, district: d.name, districtId: String(d.id || '') })
        );
        await Promise.all(promises);
        await loadTrackedData(); 
        setIsModalOpen(false);
    } catch (error) {
        console.error(error);
        alert(t('stats.errors.add_failed'));
    } finally {
        setIsAdding(false);
    }
  };

  const totalPages = Math.ceil(trackedItems.length / ITEMS_PER_PAGE);
  const startIndex = currentPage * ITEMS_PER_PAGE;
  const visibleItems = trackedItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  if (loading && trackedItems.length === 0) {
    return <div className="text-center p-12 text-textSecondary bg-body rounded-xl border border-dashed border-borderClient font-heading">{t('stats.status.loading')}</div>;
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-borderClient flex-wrap gap-4">
        
        <div className="md:flex items-center gap-3 hidden">
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-warning/10 text-warning text-lg shrink-0">
            <FaBookmark />
          </div>
          <h2 className="text-xl font-heading font-bold text-textMain m-0 tracking-wide">{t('stats.tracked_districts.title')}</h2>
        </div>
        
        <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto">
          {trackedItems.length > ITEMS_PER_PAGE && (
            <div className="flex items-center gap-2 bg-body p-1 rounded-lg border border-borderClient">
              <button className="bg-surface border border-borderClient w-8 h-8 rounded flex items-center justify-center cursor-pointer transition-all text-textSecondary text-xs hover:not(:disabled):bg-hover hover:not(:disabled):text-textMain hover:not(:disabled):border-accent disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 0}>
                <FaChevronLeft />
              </button>
              <span className="text-sm text-textSecondary font-semibold min-w-[40px] text-center tabular-nums">{currentPage + 1} / {totalPages}</span>
              <button className="bg-surface border border-borderClient w-8 h-8 rounded flex items-center justify-center cursor-pointer transition-all text-textSecondary text-xs hover:not(:disabled):bg-hover hover:not(:disabled):text-textMain hover:not(:disabled):border-accent disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages - 1}>
                <FaChevronRight />
              </button>
            </div>
          )}
          <button className="flex items-center gap-2 bg-body text-accent border border-borderClient px-4 py-2 rounded-lg font-semibold text-sm cursor-pointer transition-all font-heading uppercase tracking-widest hover:not(:disabled):bg-hover hover:not(:disabled):border-accent" onClick={() => setIsModalOpen(true)} disabled={isAdding}>
            <FaPlus /> {isAdding ? '...' : t('stats.actions.add')}
          </button>
        </div>
      </div>

      {trackedItems.length === 0 ? (
        <div className="text-center p-12 text-textSecondary bg-body rounded-xl border border-dashed border-borderClient font-heading">
          <p>{t('stats.tracked_districts.empty')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {visibleItems.map((item) => (
              <div key={item.id} className="border border-borderClient bg-body rounded-xl p-5 cursor-pointer transition-all flex flex-col relative hover:-translate-y-1 hover:border-accent hover:shadow-hover group" onClick={() => handleNavigate(item)}>
                
                <div className="mb-4 border-b border-dashed border-borderClient pb-4 flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-bold text-textMain font-heading m-0">{item.district}</h3>
                    <span className="text-sm text-textSecondary">{item.city}, {item.country}</span>
                  </div>
                  <button className="bg-transparent border border-transparent cursor-pointer p-2 rounded-lg flex items-center justify-center transition-all text-textSecondary hover:bg-danger/10 hover:text-danger" onClick={(e) => handleDeleteClick(e, item.id)}>
                      <FaTrash />
                  </button>
                </div>
                
                <div className="flex flex-col gap-3 mb-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-sm text-textSecondary font-medium uppercase tracking-wide">
                      <FaKey className="text-accent text-sm" /> 
                      <span>{t('common.fields.average_rent_price')}</span>
                    </div>
                    <span className="font-bold text-textMain text-base font-heading">
                        {/* Виправлено: обгортаємо item.country у getCurrencyInfo */}
                        {formatPrice(item.rental_price || item.avg_price_rent, getCurrencyInfo(item.country))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-sm text-textSecondary font-medium uppercase tracking-wide">
                      <FaHome className="text-success text-sm" /> 
                      <span>{t('common.fields.propertyPricePerSqm')}</span>
                    </div>
                    <span className="font-bold text-textMain text-base font-heading">
                        {/* Виправлено: обгортаємо item.country у getCurrencyInfo */}
                        {formatPrice(item.sale_price || item.avg_price_sqm, getCurrencyInfo(item.country))}
                    </span>
                  </div>
                </div>
                
                <div className="mt-auto flex justify-between items-center pt-3 border-t border-borderClient">
                    <div className="flex items-center gap-1.5 text-xs text-textSecondary">
                      <FaClock className="text-textSecondary text-xs" />
                      <span>{t('stats.labels.updated')} {formatDate(item.updated_at || item.created_at, t('stats.labels.date_unknown'))}</span>
                    </div>
                    <div className="text-accent flex items-center justify-center w-7 h-7 rounded-full bg-accent/10 transition-all text-xs group-hover:bg-accent group-hover:text-white group-hover:translate-x-1">
                      <FaArrowRight />
                    </div>
                </div>
              </div>
            ))}
        </div>
      )}
      
      {isModalOpen && (
        <LocationSelectorModal 
          onClose={() => setIsModalOpen(false)} 
          onSubmit={handleAddSubmit as any}
          includeDistrict={true}
          trackedLocations={trackedItems} 
        />
      )}

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title={t('stats.modals.delete_title')}
        message={t('stats.modals.delete_confirm')}
      />
    </div>
  );
}