// components/FavoritesPage/FavoritesPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { favoritesApi } from '../../components/api/favoritesApi'; 
import { supabase } from '../../supabaseClient';
import DistrictModal from './DistrictModal';
import styles from './FavoritesPage.module.css';

export default function FavoritesPage() {
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
        setError('Будь ласка, увійдіть в систему');
        return;
      }

      const data = await favoritesApi.getFavorites();
      setFavorites(data);
    } catch (err) {
      setError(err.message || 'Помилка завантаження');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (districtId, e) => {
    e.stopPropagation();
    if (!window.confirm('Видалити з улюблених?')) return;
    
    try {
      await favoritesApi.removeFavorite(districtId);
      setFavorites(prev => prev.filter(d => d.id !== districtId)); 
    } catch (err) {
      alert('Помилка видалення: ' + err.message);
    }
  };

  const handleCardClick = (district) => {
    setSelectedDistrict(district);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDistrict(null);
  };
  
  // Функція для оновлення списку, якщо видалення відбулося в модальному вікні
  const handleToggleFavorite = (districtId, isFavorite) => {
    if (!isFavorite) {
      // Якщо статус змінився на "не улюблений", видаляємо його зі списку
      setFavorites(prev => prev.filter(d => d.id !== districtId));
    }
    // Якщо статус змінився на "улюблений", нічого не робимо (він уже є або буде доданий пізніше)
  };


  const formatPrice = (price) => {
    if (!price && price !== 0) return 'н/д';
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency: 'UAH',
      minimumFractionDigits: 0
    }).format(price);
  };

  const renderStars = (rating) => {
    if (!rating) return 'н/д';
    const stars = Math.min(5, Math.max(0, rating / 2));
    return '★'.repeat(Math.floor(stars)) + '☆'.repeat(5 - Math.floor(stars));
  };


  if (loading) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>⏳</div>
        <p className={styles.emptyTitle}>Завантаження...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>⚠️</div>
        <p className={styles.emptyTitle}>Помилка: {error}</p>
        <button onClick={() => navigate('/login')} className={styles.detailsButton}>
          Спробувати увійти
        </button>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>⭐</div>
        <h2 className={styles.emptyTitle}>Немає улюблених районів</h2>
        <p className={styles.emptyDescription}>Додайте райони до улюблених на карті, натискаючи на ❤️</p>
      </div>
    );
  }

  return (
    <>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Улюблені райони</h1>
          <span className={styles.favoritesCount}>{favorites.length}</span>
        </header>

        <div className={styles.favoritesGrid}>
          {favorites.map(district => (
            <div 
              key={district.id} 
              className={styles.favoriteCard}
              onClick={() => handleCardClick(district)}
            >
              <div className={styles.cardHeader}>
                <h3 className={styles.districtName}>{district.name}</h3>
                <button 
                  className={styles.removeButton}
                  onClick={(e) => handleRemove(district.id, e)} // district.id - ID району
                  title="Видалити"
                >
                  ❌
                </button>
              </div>

              <div className={styles.location}>
                <span>{district.city}</span>
                {district.country !== "Невідомо" && (
                  <span className={styles.country}>, {district.country}</span>
                )}
              </div>

              {district.filterData?.general?.propertyPrice && (
                <div className={styles.price}>
                  {formatPrice(district.filterData.general.propertyPrice)}
                </div>
              )}

              <div className={styles.statsGrid}>
                {district.filterData?.education?.rating && (
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>🎓 Освіта</span>
                    <span className={styles.ratingStars}>
                      {renderStars(district.filterData.education.rating)}
                      <small className={styles.ratingValue}>({district.filterData.education.rating?.toFixed(1)})</small>
                    </span>
                  </div>
                )}
                {district.filterData?.transport?.rating && (
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>🚍 Транспорт</span>
                    <span className={styles.ratingStars}>
                      {renderStars(district.filterData.transport.rating)}
                      <small className={styles.ratingValue}>({district.filterData.transport.rating?.toFixed(1)})</small>
                    </span>
                  </div>
                )}
                {district.filterData?.safety?.rating && (
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>🛡️ Безпека</span>
                    <span className={styles.ratingStars}>
                      {renderStars(district.filterData.safety.rating)}
                      <small className={styles.ratingValue}>({district.filterData.safety.rating?.toFixed(1)})</small>
                    </span>
                  </div>
                )}
              </div>

              <div className={styles.cardActions}>
                <button className={styles.detailsButton} onClick={(e) => {
                  e.stopPropagation();
                  handleCardClick(district);
                }}>
                  Детальніше
                </button>
                {district.addedAt && (
                  <small className={styles.date}>
                    Додано: {new Date(district.addedAt).toLocaleDateString('uk-UA')}
                  </small>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && selectedDistrict && (
        <DistrictModal
          district={selectedDistrict}
          isOpen={isModalOpen}
          onClose={closeModal}
          onToggleFavorite={handleToggleFavorite} 
        />
      )}
    </>
  );
}