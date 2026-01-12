import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { favoritesApi } from '../../components/api/favoritesApi'; 
import { supabase } from '../../supabaseClient';
import { transformDistrictsForDisplay } from '../../utils/dataTransformers'; 
import DistrictDetailsModal from '../../components/districtMap/DistrictDetailsModal';
import mapStyles from '../../components/districtMap/DistrictsMap.module.css'; 
import styles from './FavoritesPage.module.css';
import { formatPrice, getCurrencyInfo } from '../../utils/formatters'; // Додано getCurrencyInfo

const FavoriteDistrictCard = React.memo(({ district, onClick, onRemove }) => {
    const { t } = useTranslation('favorites');
    const filterData = district.filterData;
    const na = t('na');
    
    // Визначаємо валюту для конкретного району
    const currencyInfo = getCurrencyInfo(district.country);
    
    return (
        <div className={mapStyles.districtCard} onClick={() => onClick(district)}>
            <button 
                className={styles.removeButton} 
                onClick={(e) => { e.stopPropagation(); onRemove(district.id, e); }}
                title={t('remove_tooltip')}
            >
                ❌
            </button>

            {district.photo_url ? (
                <img 
                    src={district.photo_url} 
                    alt={district.photo_description || district.name}
                    className={mapStyles.districtPhoto}
                    loading="lazy"
                />
            ) : (
                <div className={mapStyles.photoPlaceholder}>🏙️</div>
            )}
            
            <div className={mapStyles.districtName}>{district.name}</div>
            
            {filterData?.general?.propertyPrice && (
                <div className={styles.priceTag}>
                    {/* Передаємо код валюти та локаль */}
                    {formatPrice(filterData.general.propertyPrice, currencyInfo.code, currencyInfo.locale)}
                </div>
            )}

            {filterData && (
                <div className={mapStyles.districtStats}>
                    <span className={mapStyles.statBadge}>🏫 {filterData.education?.rating?.toFixed(1) || na}</span>
                    <span className={mapStyles.statBadge}>🚍 {filterData.transport?.rating?.toFixed(1) || na}</span>
                    <span className={mapStyles.statBadge}>🛡️ {filterData.safety?.rating?.toFixed(1) || na}</span>
                    <span className={mapStyles.statBadge}>🌳 {filterData.social?.rating?.toFixed(1) || na}</span>
                    <span className={mapStyles.statBadge}>🏥 {filterData.medicine?.rating?.toFixed(1) || na}</span>
                    <span className={mapStyles.statBadge}>🛒 {filterData.commerce?.rating?.toFixed(1) || na}</span>
                </div>
            )}
        </div>
    );
});

export default function FavoritesPage() {
    const { t } = useTranslation('favorites');
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        loadFavorites();
    }, []);

    const loadFavorites = async () => {
        try {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setError(t('errors.auth_required'));
                return;
            }
            const rawData = await favoritesApi.getFavorites();
            setFavorites(transformDistrictsForDisplay(rawData || []));
        } catch (err) {
            console.error('Error loading favorites:', err);
            setError(err.message || t('errors.load_failed'));
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (districtId, e) => {
        if (e) e.stopPropagation();
        if (!window.confirm(t('confirm_remove'))) return;
        
        const previousFavorites = [...favorites];
        setFavorites(prev => prev.filter(d => d.id !== districtId));

        try {
            await favoritesApi.removeFavorite(districtId);
        } catch (err) {
            setFavorites(previousFavorites);
            alert(`${t('errors.delete_failed')}: ${err.message}`);
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
    
    const handleToggleFavorite = useCallback((districtId, isFavorite) => {
        if (!isFavorite) {
            setFavorites(prev => prev.filter(d => d.id !== districtId));
        }
    }, []);

    if (loading) return <div className={styles.emptyState}><div className={styles.emptyIcon}>⏳</div></div>;

    if (error) {
        return (
            <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>⚠️</div>
                <p className={styles.emptyTitle}>{error}</p>
                <button onClick={() => navigate('/login')} className={styles.detailsButton}>
                    {t('buttons.login')}
                </button>
            </div>
        );
    }

    if (favorites.length === 0) {
        return (
            <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>⭐</div>
                <h2 className={styles.emptyTitle}>{t('empty.title')}</h2>
                <p className={styles.emptyDescription}>{t('empty.description')}</p>
            </div>
        );
    }

    return (
        <>
            <div className={styles.container}>
                <header className={styles.header}>
                    <h1 className={styles.title}>{t('title')}</h1>
                    <span className={styles.favoritesCount}>{favorites.length}</span>
                </header>

                <div className={styles.favoritesGrid}>
                    {favorites.map(district => (
                        <FavoriteDistrictCard
                            key={district.id}
                            district={district}
                            onClick={handleCardClick}
                            onRemove={handleRemove}
                        />
                    ))}
                </div>
            </div>

            <DistrictDetailsModal
                district={selectedDistrict}
                isOpen={isModalOpen}
                onClose={closeModal}
                onToggleFavorite={handleToggleFavorite} 
            />
        </>
    );
}