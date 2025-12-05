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
      alert('Помилка видалення');
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
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Завантаження...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h2>{error}</h2>
        <button onClick={() => navigate('/login')} className={styles.loginBtn}>
          Увійти
        </button>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <div className={styles.emptyIcon}>⭐</div>
        <h2>Немає улюблених районів</h2>
        <p>Додавайте райони до улюблених, натискаючи на ❤️</p>
      </div>
    );
  }

  return (
    <>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1>Улюблені райони</h1>
          <span className={styles.count}>{favorites.length}</span>
        </header>

        <div className={styles.grid}>
          {favorites.map(district => (
            <div 
              key={district.id} 
              className={styles.card}
              onClick={() => handleCardClick(district)}
            >
              <div className={styles.cardHeader}>
                <h3>{district.name}</h3>
                <button 
                  className={styles.removeBtn}
                  onClick={(e) => handleRemove(district.id, e)}
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

              <div className={styles.stats}>
                {district.filterData?.education?.rating && (
                  <div className={styles.stat}>
                    <span>🎓 Освіта</span>
                    <span className={styles.rating}>
                      {renderStars(district.filterData.education.rating)}
                      <small>({district.filterData.education.rating?.toFixed(1)})</small>
                    </span>
                  </div>
                )}
                {district.filterData?.transport?.rating && (
                  <div className={styles.stat}>
                    <span>🚍 Транспорт</span>
                    <span className={styles.rating}>
                      {renderStars(district.filterData.transport.rating)}
                      <small>({district.filterData.transport.rating?.toFixed(1)})</small>
                    </span>
                  </div>
                )}
                {district.filterData?.safety?.rating && (
                  <div className={styles.stat}>
                    <span>🛡️ Безпека</span>
                    <span className={styles.rating}>
                      {renderStars(district.filterData.safety.rating)}
                      <small>({district.filterData.safety.rating?.toFixed(1)})</small>
                    </span>
                  </div>
                )}
              </div>

              <div className={styles.footer}>
                <button className={styles.detailsBtn} onClick={(e) => {
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
          onClose={closeModal}
          formatPrice={formatPrice}
          renderStars={renderStars}
        />
      )}
    </>
  );
}