import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFavorites } from './FavoritesContext';
import DistrictDetailsModal from '@components/districtMap/DistrictDetailsModal';
import styles from './FavoritesPage.module.css'; 
import { formatPrice, getCurrencyInfo } from '@utils/formatters';

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

const FavoriteDistrictCard = React.memo(({ district, onClick, onRemove }) => {
    const { t } = useTranslation(['favorites', 'common']);
    const filterData = district.filterData;
    const na = '-';
    
    const countryName = district.country || district.cities?.countries?.name || '';
    const currencyInfo = getCurrencyInfo(countryName);
    
    return (
        <div className={styles.card} onClick={() => onClick(district)}>
            <div className={styles.imageContainer}>
                {district.photo_url ? (
                    <img 
                        src={district.photo_url} 
                        alt={district.photo_description || district.name}
                        className={styles.cardPhoto}
                        loading="lazy"
                    />
                ) : (
                    <div className={styles.photoPlaceholder}>
                        <span style={{fontSize: '3rem'}}>🏙️</span>
                    </div>
                )}
                
                <button 
                    className={styles.removeButton} 
                    onClick={(e) => { e.stopPropagation(); onRemove(district.id, e); }}
                    title={t('favorites:remove_tooltip')}
                >
                    <TrashIcon />
                </button>
                
                <div className={styles.cardOverlay}>
                      <h3 className={styles.cardName}>{district.name}</h3>
                </div>
            </div>

            <div className={styles.cardContent}>
                <div className={styles.priceRow}>
                    <span className={styles.priceLabel}>{t('favorites:price_label')}</span>
                    {filterData?.general?.propertyPrice ? (
                        <span className={styles.priceValue}>
                            {formatPrice(filterData.general.propertyPrice, currencyInfo)}
                        </span>
                    ) : (
                        <span className={styles.priceValue}>{na}</span>
                    )}
                </div>

                {filterData && (
                    <div className={styles.statsGrid}>
                        <div className={styles.statItem} title={t('common:categories.education')}>
                            <span className={styles.statIcon}>🏫</span>
                            <span className={styles.statValue}>{filterData.education?.rating?.toFixed(1) || na}</span>
                        </div>
                        <div className={styles.statItem} title={t('common:categories.transport')}>
                            <span className={styles.statIcon}>🚍</span>
                            <span className={styles.statValue}>{filterData.transport?.rating?.toFixed(1) || na}</span>
                        </div>
                        <div className={styles.statItem} title={t('common:categories.safety')}>
                            <span className={styles.statIcon}>🛡️</span>
                            <span className={styles.statValue}>{filterData.safety?.rating?.toFixed(1) || na}</span>
                        </div>
                        <div className={styles.statItem} title={t('common:categories.social')}>
                            <span className={styles.statIcon}>🌳</span>
                            <span className={styles.statValue}>{filterData.social?.rating?.toFixed(1) || na}</span>
                        </div>
                        <div className={styles.statItem} title={t('common:categories.medicine')}>
                            <span className={styles.statIcon}>🏥</span>
                            <span className={styles.statValue}>{filterData.medicine?.rating?.toFixed(1) || na}</span>
                        </div>
                        <div className={styles.statItem} title={t('common:categories.commerce')}>
                            <span className={styles.statIcon}>🛒</span>
                            <span className={styles.statValue}>{filterData.commerce?.rating?.toFixed(1) || na}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});

export default function FavoritesPage() {
    const { t } = useTranslation(['favorites', 'common']);
    const navigate = useNavigate();
    
    const { favorites, loading, removeFavorite, toggleFavorite, isFavorite } = useFavorites();
    
    const [selectedDistrict, setSelectedDistrict] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    useEffect(() => {
        const totalPages = Math.ceil(favorites.length / itemsPerPage) || 1;
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [favorites.length, itemsPerPage, currentPage]);

    const handleRemove = async (districtId, e) => {
        if (e) e.stopPropagation();
        if (!window.confirm(t('favorites:confirm_remove'))) return;
        
        try {
            await removeFavorite(districtId);
        } catch (err) {
            alert(t('favorites:errors.delete_failed'));
        }
    };

    const handleCardClick = useCallback((district) => {
        setSelectedDistrict(district);
        setIsModalOpen(true);
    }, []);

    const closeModal = useCallback(() => {
        setIsModalOpen(false);
        setSelectedDistrict(null);
    }, []);
    
    if (loading) return <div className={styles.loaderContainer}><div className={styles.spinner}></div></div>;

    if (favorites.length === 0) {
        return (
            <div className={styles.stateContainer}>
                <div className={styles.stateIcon}>⭐</div>
                <h2 className={styles.stateTitle}>{t('favorites:empty.title')}</h2>
                <p className={styles.stateDescription}>{t('favorites:empty.description')}</p>
                <button onClick={() => navigate('/')} className={styles.primaryButton} style={{marginTop: '20px'}}>
                    {t('favorites:buttons.go_to_map')}
                </button>
            </div>
        );
    }

    const totalPages = Math.ceil(favorites.length / itemsPerPage);
    const paginatedFavorites = favorites.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <>
            <div className={styles.container}>
                <header className={styles.header}>
                    <div className={styles.headerContent}>
                        <h1 className={styles.title}>{t('favorites:title')}</h1>
                    </div>
                </header>

                <div className={styles.favoritesGrid}>
                    {paginatedFavorites.map(district => (
                        <FavoriteDistrictCard
                            key={district.id}
                            district={district}
                            onClick={handleCardClick}
                            onRemove={handleRemove}
                        />
                    ))}
                </div>

                {totalPages > 1 && (
                    <div className={styles.pagination}>
                        <button 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            ←
                        </button>
                        <span>{currentPage} / {totalPages}</span>
                        <button 
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            →
                        </button>
                    </div>
                )}
            </div>

            <DistrictDetailsModal
                district={selectedDistrict}
                isOpen={isModalOpen}
                onClose={closeModal}
                onToggleFavorite={() => toggleFavorite(selectedDistrict)} 
                isFavorite={selectedDistrict ? isFavorite(selectedDistrict.id) : false}
            />
        </>
    );
}