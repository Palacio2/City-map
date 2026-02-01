import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FaBookmark, FaKey, FaHome, FaArrowRight, FaTrash, FaChevronLeft, FaChevronRight, FaPlus, FaClock } from 'react-icons/fa';
import { fetchTrackedDistrictsWithStats, removeTrackedDistrict, addTrackedDistrict } from '@api/trackedDistrictsApi';
import { formatPrice } from '@utils/formatters.jsx';
import LocationSelectorModal from '../PopularDistricts/LocationSelectorModal';
import ConfirmationModal from './ConfirmationModal';
import styles from './TrackedDistricts.module.css';

const ITEMS_PER_PAGE = 3;
const STORAGE_KEY_PAGE = 'tracked_districts_page';
const STORAGE_KEY_DATA = 'tracked_districts_data';

const formatDate = (dateString, defaultText) => {
  if (!dateString) return defaultText;
  return new Date(dateString).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function TrackedDistricts() {
  const { t } = useTranslation(['stats', 'common']);
  const navigate = useNavigate();
  
  const [trackedItems, setTrackedItems] = useState(() => {
    try {
      const cached = sessionStorage.getItem(STORAGE_KEY_DATA);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState(() => {
    return trackedItems.length === 0;
  });

  const [currentPage, setCurrentPage] = useState(() => {
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
  const [districtToDelete, setDistrictToDelete] = useState(null);

  useEffect(() => { loadTrackedData(); }, []);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY_PAGE, currentPage);
  }, [currentPage]);

  const updateLocalData = (newData) => {
    setTrackedItems(newData);
    sessionStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(newData));
  };

  const loadTrackedData = async () => {
    if (trackedItems.length === 0) {
        setLoading(true);
    }
    
    try {
      const data = await fetchTrackedDistrictsWithStats();
      updateLocalData(data);
      
      const maxPage = Math.ceil(data.length / ITEMS_PER_PAGE) - 1;
      if (currentPage > maxPage && maxPage >= 0) {
        setCurrentPage(maxPage);
      }
    } catch (err) { 
    } finally { 
        setLoading(false); 
    }
  };

  const handleNavigate = (item) => {
    if (item.city && item.country && item.district) {
       navigate(`/map/${encodeURIComponent(item.country)}/${encodeURIComponent(item.city)}?district=${encodeURIComponent(item.district)}`);
    }
  };

  const handleDeleteClick = (e, id) => {
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
    } catch (err) {
      alert(t('stats:error_delete'));
    } finally {
      setDeleteModalOpen(false);
      setDistrictToDelete(null);
    }
  };

  const handleAddSubmit = async (country, city, districtsArray) => {
    if (!country || !city || !districtsArray || districtsArray.length === 0) return;
    
    setIsAdding(true);
    try {
        const promises = districtsArray.map(d => 
            addTrackedDistrict({ 
                country, 
                city, 
                district: d.name, 
                districtId: d.id 
            })
        );

        await Promise.all(promises);
        await loadTrackedData(); 
        setIsModalOpen(false);
    } catch (error) {
        alert(t('stats:error_add_multiple_districts'));
    } finally {
        setIsAdding(false);
    }
  };

  const totalPages = Math.ceil(trackedItems.length / ITEMS_PER_PAGE);
  const startIndex = currentPage * ITEMS_PER_PAGE;
  const visibleItems = trackedItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  if (loading && trackedItems.length === 0) return <div className={styles.loader}>{t('stats:loading')}...</div>;

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <div className={styles.titleWrapper}>
          <FaBookmark className={styles.icon} />
          <h2 className={styles.title}>{t('stats:stats_page.saved_districts_prices')}</h2>
        </div>
        <div className={styles.actions}>
          {trackedItems.length > ITEMS_PER_PAGE && (
            <div className={styles.controls}>
              <button 
                className={styles.navBtn} 
                onClick={() => setCurrentPage(p => p - 1)} 
                disabled={currentPage === 0}
                style={{minWidth: '32px', minHeight: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
              >
                <FaChevronLeft className={styles.navIcon} style={{color: '#4a5568', fontSize: '14px'}} />
              </button>
              <span className={styles.pageIndicator}>{currentPage + 1} / {totalPages}</span>
              <button 
                className={styles.navBtn} 
                onClick={() => setCurrentPage(p => p + 1)} 
                disabled={currentPage >= totalPages - 1}
                style={{minWidth: '32px', minHeight: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
              >
                <FaChevronRight className={styles.navIcon} style={{color: '#4a5568', fontSize: '14px'}} />
              </button>
            </div>
          )}
          <button className={styles.addBtn} onClick={() => setIsModalOpen(true)} disabled={isAdding}>
            <FaPlus /> {isAdding ? '...' : t('stats:add_button')}
          </button>
        </div>
      </div>

      {trackedItems.length === 0 ? (
        <div className={styles.empty}>
          <p>{t('stats:empty_tracked_list')}</p>
        </div>
      ) : (
        <div className={styles.grid}>
            {visibleItems.map((item) => (
              <div key={item.id} className={styles.card} onClick={() => handleNavigate(item)}>
                <div className={styles.cardHeader}>
                  <div>
                    <span className={styles.name}>{item.district}</span>
                    <span className={styles.location}>{item.city}, {item.country}</span>
                  </div>
                  <button className={styles.deleteBtn} onClick={(e) => handleDeleteClick(e, item.id)}>
                      <FaTrash />
                  </button>
                </div>
                <div className={styles.prices}>
                  <div className={styles.priceRow}>
                    <div className={styles.priceLabel}>
                      <FaKey className={styles.rentIcon} /> <span>{t('common:fields.average_rent_price')}</span>
                    </div>
                    <span className={styles.priceValue}>
                        {formatPrice(item.rental_price || item.avg_price_rent, item.country)}
                    </span>
                  </div>
                  <div className={styles.priceRow}>
                    <div className={styles.priceLabel}>
                      <FaHome className={styles.saleIcon} /> <span>{t('common:fields.propertyPricePerSqm')}</span>
                    </div>
                    <span className={styles.priceValue}>
                        {formatPrice(item.sale_price || item.avg_price_sqm, item.country)}
                    </span>
                  </div>
                </div>
                <div className={styles.cardFooter}>
                    <div className={styles.updatedAt}>
                      <FaClock className={styles.clockIcon} />
                      <span>{t('stats:updated_label')} {formatDate(item.updated_at || item.created_at, t('stats:date_unknown'))}</span>
                    </div>
                    <span className={styles.detailsLink}><FaArrowRight /></span>
                </div>
              </div>
            ))}
        </div>
      )}
      
      {isModalOpen && (
        <LocationSelectorModal 
          onClose={() => setIsModalOpen(false)} 
          onSubmit={handleAddSubmit}
          includeDistrict={true}
          trackedLocations={trackedItems} 
        />
      )}

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title={t('stats:delete_modal_title')}
        message={t('stats:confirm_delete_district')}
      />
    </div>
  );
}