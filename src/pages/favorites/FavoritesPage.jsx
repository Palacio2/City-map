import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useFavorites } from "./FavoritesContext";
import DistrictDetailsModal from "@components/districtMap/DistrictDetailsModal";
import Loader from "@components/loader/Loader";
import styles from "./FavoritesPage.module.css";
import { formatPrice, getCurrencyInfo } from "@utils/formatters";

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const FavoriteDistrictCard = React.memo(({ district, onClick, onCategoryClick, onRemove }) => {
  const { t } = useTranslation(["favorites", "common"]);
  const currencyInfo = useMemo(() => getCurrencyInfo(district.country || district.cities?.countries?.name || ""), [district]);
  const filterData = district.filterData;

  const statsConfig = [
    ["education", "🏫"], ["transport", "🚍"], ["safety", "🛡️"],
    ["social", "🌳"], ["medicine", "🏥"], ["commerce", "🛒"], ["utilities", "⚡"]
  ];

  return (
    <div className={styles.card} onClick={() => onClick(district)}>
      <div className={styles.imageContainer}>
        {district.photo_url ? (
          <img src={district.photo_url} alt={district.name} className={styles.cardPhoto} loading="lazy" />
        ) : (
          <div className={styles.photoPlaceholder}>🏙️</div>
        )}
        <button
          className={styles.removeButton}
          onClick={(e) => { e.stopPropagation(); onRemove(district.id); }}
          title={t("favorites:remove_tooltip")}
        >
          <TrashIcon />
        </button>
        <div className={styles.cardOverlay}>
          <h3 className={styles.cardName}>{district.name}</h3>
        </div>
      </div>

      <div className={styles.cardContent}>
        <div className={styles.priceRow}>
          <span className={styles.priceLabel}>{t("favorites:price_label")}</span>
          <span className={styles.priceValue}>
            {filterData?.general?.propertyPrice ? formatPrice(filterData.general.propertyPrice, currencyInfo) : "-"}
          </span>
        </div>

        {filterData && (
          <div className={styles.statsGrid}>
            {statsConfig.map(([key, icon]) => (
              <button 
                key={key} 
                className={styles.statItem} 
                title={t(`common:categories.${key}`)}
                onClick={(e) => {
                  e.stopPropagation();
                  onCategoryClick(district, key);
                }}
              >
                <span className={styles.statIcon}>{icon}</span>
                <span className={styles.statValue}>{(filterData?.[key]?.rating ?? filterData?.[key]?.qualityRating)?.toFixed(1) || "-"}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

export default function FavoritesPage() {
  const { t } = useTranslation("favorites");
  const navigate = useNavigate();
  const { favorites, loading, toggleFavorite, isFavorite } = useFavorites();

  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(window.innerWidth < 640 ? 4 : 8);

  useEffect(() => {
    const handleResize = () => setItemsPerPage(window.innerWidth < 640 ? 4 : 8);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const totalPages = Math.ceil(favorites.length / itemsPerPage) || 1;

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedFavorites = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return favorites.slice(start, start + itemsPerPage);
  }, [favorites, currentPage, itemsPerPage]);

  if (loading) return <Loader fullScreen />;

  if (!favorites.length) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>⭐</div>
        <h2>{t("empty.title")}</h2>
        <p>{t("empty.description")}</p>
        <button className={styles.primaryButton} onClick={() => navigate("/")}>
          {t("buttons.go_to_map")}
        </button>
      </div>
    );
  }

  return (
    <>
      <div className={styles.container}>
        <h1 className={styles.title}>{t("title")}</h1>
        <div className={styles.grid}>
          {paginatedFavorites.map((district) => (
            <FavoriteDistrictCard
              key={district.id}
              district={district}
              onClick={(d) => { 
                setSelectedDistrict(d); 
                setSelectedCategory(null);
                setIsModalOpen(true); 
              }}
              onCategoryClick={(d, categoryKey) => {
                setSelectedDistrict(d);
                setSelectedCategory(categoryKey);
                setIsModalOpen(true);
              }}
              onRemove={(id) => toggleFavorite({ id })}
            />
          ))}
        </div>

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>←</button>
            <span>{currentPage} / {totalPages}</span>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>→</button>
          </div>
        )}
      </div>

      <DistrictDetailsModal
        district={selectedDistrict}
        selectedCategory={selectedCategory}
        isOpen={isModalOpen}
        onClose={() => { 
          setIsModalOpen(false); 
          setTimeout(() => {
            setSelectedDistrict(null); 
            setSelectedCategory(null);
          }, 300);
        }}
        onToggleFavorite={() => selectedDistrict && toggleFavorite(selectedDistrict)}
        isFavorite={selectedDistrict ? isFavorite(selectedDistrict.id) : false}
      />
    </>
  );
}