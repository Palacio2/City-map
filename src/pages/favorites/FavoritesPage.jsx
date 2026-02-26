import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useFavorites } from "./FavoritesContext";
import DistrictDetailsModal from "@components/districtMap/DistrictDetailsModal";
import styles from "./FavoritesPage.module.css";
import { formatPrice, getCurrencyInfo } from "@utils/formatters";

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const FavoriteDistrictCard = React.memo(({ district, onClick, onRemove }) => {
  const { t } = useTranslation(["favorites", "common"]);

  const currencyInfo = useMemo(() => {
    const countryName = district.country || district.cities?.countries?.name || "";
    return getCurrencyInfo(countryName);
  }, [district]);

  const filterData = district.filterData;

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
          <div className={styles.photoPlaceholder}>🏙️</div>
        )}

        <button
          className={styles.removeButton}
          onClick={(e) => {
            e.stopPropagation();
            onRemove(district.id);
          }}
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
          <span className={styles.priceLabel}>
            {t("favorites:price_label")}
          </span>
          <span className={styles.priceValue}>
            {filterData?.general?.propertyPrice
              ? formatPrice(filterData.general.propertyPrice, currencyInfo)
              : "-"}
          </span>
        </div>

        {filterData && (
          <div className={styles.statsGrid}>
            {[
              ["education", "🏫"],
              ["transport", "🚍"],
              ["safety", "🛡️"],
              ["social", "🌳"],
              ["medicine", "🏥"],
              ["commerce", "🛒"],
              ["utilities", "⚡"],
            ].map(([key, icon]) => (
              <div
                key={key}
                className={styles.statItem}
                title={t(`common:categories.${key}`)}
              >
                <span>{icon}</span>
                <span>
                  {(filterData?.[key]?.rating ?? filterData?.[key]?.qualityRating)?.toFixed(1) || "-"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

export default function FavoritesPage() {
  const { t } = useTranslation(["favorites"]);
  const navigate = useNavigate();
  const { favorites, loading, toggleFavorite, isFavorite } = useFavorites();

  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(window.innerWidth < 640 ? 3 : 6);

  useEffect(() => {
    const handleResize = () => {
      setItemsPerPage(window.innerWidth < 640 ? 3 : 6);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const totalPages = Math.ceil(favorites.length / itemsPerPage) || 1;

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedFavorites = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return favorites.slice(start, start + itemsPerPage);
  }, [favorites, currentPage, itemsPerPage]);

  const handleRemove = useCallback((id) => {
    toggleFavorite({ id });
  }, [toggleFavorite]);

  const openModal = useCallback((district) => {
    setSelectedDistrict(district);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedDistrict(null);
  }, []);

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  if (!favorites.length) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>⭐</div>
        <h2>{t("favorites:empty.title")}</h2>
        <p>{t("favorites:empty.description")}</p>
        <button
          className={styles.primaryButton}
          onClick={() => navigate("/")}
        >
          {t("favorites:buttons.go_to_map")}
        </button>
      </div>
    );
  }

  return (
    <>
      <div className={styles.container}>
        <h1 className={styles.title}>
          {t("favorites:title")}
        </h1>

        <div className={styles.grid}>
          {paginatedFavorites.map((district) => (
            <FavoriteDistrictCard
              key={district.id}
              district={district}
              onClick={openModal}
              onRemove={handleRemove}
            />
          ))}
        </div>

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              ←
            </button>
            <span>{currentPage} / {totalPages}</span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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
        onToggleFavorite={() =>
          selectedDistrict && toggleFavorite(selectedDistrict)
        }
        isFavorite={
          selectedDistrict ? isFavorite(selectedDistrict.id) : false
        }
      />
    </>
  );
}