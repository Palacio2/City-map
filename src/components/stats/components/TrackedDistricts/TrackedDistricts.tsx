import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@auth/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaKey, FaHome, FaArrowRight, FaTrash, FaChevronLeft, FaChevronRight, FaPlus, FaClock } from 'react-icons/fa';
import { fetchTrackedDistrictsWithStats, removeTrackedDistrict, addTrackedDistrict } from '@stats/api/trackedDistrictsApi';
import { useFormat } from '@hooks/useFormat';
import LocationSelectorModal, { DistrictSelection } from '../PopularDistricts/LocationSelectorModal';
import ConfirmationModal from './ConfirmationModal';

const ITEMS_PER_PAGE = 3;

import type { TrackedDistrict } from '../../types';

interface TrackedDistrictsProps {
  districts?: TrackedDistrict[];
}

export default function TrackedDistricts({ districts: initialDistricts }: TrackedDistrictsProps) {
  const { t, formatPrice, getCurrencyInfo, formatDate } = useFormat();
  const navigate = useNavigate();
  
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['trackedDistricts', user?.id];
  const { data: trackedItems = [], isLoading: loading, refetch: loadTrackedData } = useQuery({
    queryKey,
    queryFn: fetchTrackedDistrictsWithStats,
    enabled: !!user,
    initialData: initialDistricts?.length ? initialDistricts : undefined,
    initialDataUpdatedAt: 0,
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [districtToDelete, setDistrictToDelete] = useState<string | null>(null);

  const updateLocalData = (newData: TrackedDistrict[]) => queryClient.setQueryData(queryKey, newData);
  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(trackedItems.length / ITEMS_PER_PAGE) - 1);
    setCurrentPage(page => Math.min(page, maxPage));
  }, [trackedItems.length]);

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
      <div className="flex flex-col md:flex-row justify-end items-center gap-4 mb-8 pb-6 border-b border-borderClient dark:border-white/10 w-full">
        <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto">
          {trackedItems.length > ITEMS_PER_PAGE && (
            <div className="flex items-center gap-2 bg-body dark:bg-transparent p-1 rounded-lg border border-borderClient dark:border-white/10">
              <button className="bg-surface dark:bg-white/5 border border-borderClient dark:border-white/10 w-8 h-8 rounded-sm flex items-center justify-center cursor-pointer transition-all text-textSecondary text-xs hover:not-disabled:bg-hover dark:hover:not-disabled:bg-white/10 hover:not-disabled:text-textMain hover:not-disabled:border-accent disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 0}>
                <FaChevronLeft />
              </button>
              <span className="text-sm text-textSecondary font-semibold min-w-[40px] text-center tabular-nums">{currentPage + 1} / {totalPages}</span>
              <button className="bg-surface dark:bg-white/5 border border-borderClient dark:border-white/10 w-8 h-8 rounded-sm flex items-center justify-center cursor-pointer transition-all text-textSecondary text-xs hover:not-disabled:bg-hover dark:hover:not-disabled:bg-white/10 hover:not-disabled:text-textMain hover:not-disabled:border-accent disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages - 1}>
                <FaChevronRight />
              </button>
            </div>
          )}
          <button className="flex items-center gap-2 bg-surface text-accent border border-borderClient px-4 py-2 rounded-lg font-semibold text-sm cursor-pointer transition-all font-heading uppercase tracking-widest hover:not-disabled:bg-hover hover:not-disabled:border-accent dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10" onClick={() => setIsModalOpen(true)} disabled={isAdding}>
            <FaPlus /> {isAdding ? '...' : t('stats.actions.add')}
          </button>
        </div>
      </div>

      {trackedItems.length === 0 ? (
        <div className="text-center p-12 text-textSecondary bg-body rounded-xl border border-dashed border-borderClient font-heading">
          <p>{t('stats.tracked_districts.empty')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
            {visibleItems.map((item) => (
              <div key={item.id} className="bg-surface rounded-2xl p-3 sm:p-5 flex flex-col gap-3 sm:gap-4 border border-borderClient transition-all shadow-xs hover:shadow-md hover:border-accent dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10 dark:hover:border-accent dark:hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] group cursor-pointer" onClick={() => handleNavigate(item)}>
                
                <div className="mb-2 sm:mb-4 border-b border-dashed border-borderClient dark:border-white/10 pb-3 sm:pb-4 flex justify-between items-start">
                  <div className="flex flex-col gap-0.5 sm:gap-1 min-w-0 pr-2">
                    <h3 className="text-sm sm:text-lg font-bold text-textMain font-heading m-0 truncate">{item.district}</h3>
                    <span className="text-[0.65rem] sm:text-sm text-textSecondary truncate">{item.city}, {item.country}</span>
                  </div>
                  <button className="bg-transparent border border-transparent cursor-pointer p-2 rounded-lg flex items-center justify-center transition-all text-textSecondary hover:bg-danger/10 hover:text-danger" onClick={(e) => handleDeleteClick(e, item.id)}>
                      <FaTrash />
                  </button>
                </div>
                
                <div className="flex flex-col gap-3 sm:gap-3 mb-2 sm:mb-4 bg-body dark:bg-transparent p-2.5 sm:p-0 rounded-lg border border-borderClient sm:border-transparent dark:border-white/10 sm:dark:border-transparent">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-2">
                    <div className="flex items-center gap-1.5 sm:gap-2 text-[0.65rem] sm:text-sm text-textSecondary font-medium uppercase tracking-wide truncate">
                      <FaKey className="text-accent text-[0.65rem] sm:text-sm shrink-0" /> 
                      <span className="truncate">{t('common.fields.average_rent_price')}</span>
                    </div>
                    <span className="font-bold text-textMain text-sm sm:text-base font-heading whitespace-nowrap">
                        {formatPrice(item.rental_price || item.avg_price_rent, getCurrencyInfo(item.country))}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-2">
                    <div className="flex items-center gap-1.5 sm:gap-2 text-[0.65rem] sm:text-sm text-textSecondary font-medium uppercase tracking-wide truncate">
                      <FaHome className="text-success text-[0.65rem] sm:text-sm shrink-0" /> 
                      <span className="truncate">{t('common.fields.propertyPricePerSqm')}</span>
                    </div>
                    <span className="font-bold text-textMain text-sm sm:text-base font-heading whitespace-nowrap">
                        {formatPrice(item.sale_price || item.avg_price_sqm, getCurrencyInfo(item.country))}
                    </span>
                  </div>
                </div>
                
                <div className="mt-auto flex justify-between items-center pt-2 sm:pt-3 border-t border-borderClient dark:border-white/10">
                    <div className="flex items-center gap-1.5 text-[0.6rem] sm:text-xs text-textSecondary truncate pr-2">
                      <FaClock className="text-textSecondary shrink-0" />
                      <span className="truncate">{t('stats.labels.updated')} {formatDate(item.updated_at || item.created_at, { day: 'numeric', month: 'short', year: 'numeric' }, t('stats.labels.date_unknown'))}</span>
                    </div>
                    <div className="text-accent flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-accent/10 transition-all text-[0.6rem] sm:text-xs group-hover:bg-accent group-hover:text-white group-hover:translate-x-1 shrink-0">
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
          onSubmit={handleAddSubmit as (...args: unknown[]) => void}
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

