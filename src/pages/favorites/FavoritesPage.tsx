import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useFavorites } from "./FavoritesContext";
import DistrictDetailsModal from "@components/districtMap/DistrictDetailsModal";
import Loader from "@components/loader/Loader";
import { formatPrice, getCurrencyInfo } from "@utils/formatters";
import { TransformedDistrict } from "@utils/dataTransformers";

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const STATS_CONFIG = [
  ["economics", "💰"],
  ["education", "🎓"],
  ["medicine", "🏥"],
  ["commerce", "🛍️"],
  ["culture_leisure", "🎭"],
  ["sports", "⚽"],
  ["transport", "🚌"],
  ["security", "🛡️"],
] as const;

// УЛЬТИМАТИВНІ ЕКСТРАКТОРИ
const getRawDB = (d: any) => {
  if (!d) return {};
  if (d.district_filter_data) return Array.isArray(d.district_filter_data) ? d.district_filter_data[0] : d.district_filter_data;
  if (d.district_data) return Array.isArray(d.district_data) ? d.district_data[0] : d.district_data;
  return d;
};

const extractBaseVal = (d: any, key: string) => {
  if (!d) return null;
  const raw = getRawDB(d);
  
  const altKeys: Record<string, string[]> = {
     'average_sale_price_sqm': ['average_property_price', 'propertyPrice', 'average_sale_price'],
     'average_rent_price': ['rentPrice', 'average_rent'],
     'population': ['pop']
  };

  if (raw[key] !== undefined && raw[key] !== null) return Number(raw[key]);
  
  for (const alt of (altKeys[key] || [])) {
     if (raw[alt] !== undefined && raw[alt] !== null) return Number(raw[alt]);
  }

  if (d.filterData && typeof d.filterData === 'object') {
      for (const catKey of Object.keys(d.filterData)) {
          const fields = d.filterData[catKey]?.fields;
          if (fields) {
              if (fields[key]?.value !== undefined && fields[key]?.value !== null) return Number(fields[key].value);
              for (const alt of (altKeys[key] || [])) {
                 if (fields[alt]?.value !== undefined && fields[alt]?.value !== null) return Number(fields[alt].value);
              }
          }
      }
  }
  return null;
};

const extractRating = (d: any, catKey: string) => {
   if (!d) return null;
   const raw = getRawDB(d);
   const ratingKeys = [`${catKey}_rating`, `${catKey}Rating`, 'rating', 'qualityRating'];
   
   // Шукаємо в сирій базі (це вирішить проблему з 0.0)
   for (const rk of ratingKeys) {
      if (raw[rk] !== undefined && raw[rk] !== null && Number(raw[rk]) > 0) return Number(raw[rk]);
   }

   const cat = d.filterData?.[catKey];
   if (cat) {
      if (cat.rating !== undefined && cat.rating !== null && Number(cat.rating) > 0) return Number(cat.rating);
      if (cat.qualityRating !== undefined && cat.qualityRating !== null && Number(cat.qualityRating) > 0) return Number(cat.qualityRating);
   }
   return null;
};

interface FavoriteDistrictCardProps {
  district: TransformedDistrict;
  onClick: (d: TransformedDistrict) => void;
  onCategoryClick: (d: TransformedDistrict, categoryKey: string) => void;
  onRemove: (id: string | number) => void;
}

const FavoriteDistrictCard = React.memo(({ district, onClick, onCategoryClick, onRemove }: FavoriteDistrictCardProps) => {
  const { t } = useTranslation("db");
  const currencyInfo = useMemo(() => getCurrencyInfo(district.country || (district as any).cities?.countries?.name || ""), [district]);
  const filterData = district.filterData;

  const price = extractBaseVal(district, 'average_sale_price_sqm');

  return (
    <div 
      className="bg-surface rounded-2xl overflow-hidden border border-borderClient flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-accent relative w-full cursor-pointer group" 
      onClick={() => onClick(district)}
    >
      <div className="relative h-[160px] overflow-hidden bg-body transform-gpu">
        {district.photo_url ? (
          <img 
            src={district.photo_url} 
            alt={district.name} 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105" 
            loading="lazy" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[2.5rem] bg-hover text-textSecondary">🏙️</div>
        )}
        <button
          className="absolute top-3 right-3 w-8 h-8 rounded-full border-none bg-black/50 backdrop-blur-sm text-white cursor-pointer z-20 transition-all duration-200 flex items-center justify-center hover:bg-danger hover:scale-110"
          onClick={(e) => { 
            e.stopPropagation(); 
            if (district.id !== undefined) onRemove(district.id); 
          }}
          title={t("favorites.actions.remove")}
        >
          <TrashIcon />
        </button>
        <div className="absolute bottom-0 left-0 w-full h-[60%] bg-gradient-to-t from-[#0f0f0f]/95 via-[#0f0f0f]/40 to-transparent p-4 flex items-end z-10 pointer-events-none">
          <h3 className="text-white text-[1.15rem] font-bold drop-shadow-md font-heading m-0">{district.name}</h3>
        </div>
      </div>

      <div className="relative z-20 p-4 flex flex-col gap-4 grow">
        <div className="flex justify-between items-center pb-3 border-b border-dashed border-borderClient">
          <span className="text-xs uppercase tracking-[0.5px] text-textSecondary font-semibold">
            {t("favorites.labels.price")}
          </span>
          <span className="text-[1.2rem] font-extrabold text-accent font-heading">
            {price !== null ? formatPrice(price, currencyInfo) : t("favorites.status.na")}
          </span>
        </div>

        {filterData && (
          <div className="grid gap-1.5 grid-cols-3 sm:grid-cols-4">
            {STATS_CONFIG.map(([key, icon]) => {
              const ratingVal = extractRating(district, key);
              const displayRating = ratingVal !== null ? ratingVal.toFixed(1) : t("favorites.status.na");

              return (
                <button 
                  key={key} 
                  className="bg-hover rounded-[10px] p-2 flex flex-col items-center justify-center border border-borderClient text-textMain transition-all duration-200 cursor-pointer outline-none font-body hover:-translate-y-[2px] hover:border-accent hover:bg-accent hover:text-white hover:shadow-[0_4px_10px_rgba(197,164,126,0.2)] focus-visible:ring focus-visible:ring-accent focus-visible:outline-none" 
                  title={t(`favorites.categories.${key}`)}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCategoryClick(district, key);
                  }}
                >
                  <span className="text-base mb-1 drop-shadow-sm">{icon}</span>
                  <span className="font-bold text-[0.85rem]">
                    {displayRating}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

export default function FavoritesPage() {
  const { t } = useTranslation("db");
  const navigate = useNavigate();
  const { favorites, loading, toggleFavorite } = useFavorites();

  const [selectedDistrict, setSelectedDistrict] = useState<TransformedDistrict | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
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

  const handleCardClick = useCallback((d: TransformedDistrict) => {
    setSelectedDistrict(d);
    setSelectedCategory(null);
    setIsModalOpen(true);
  }, []);

  const handleCategoryClick = useCallback((d: TransformedDistrict, categoryKey: string) => {
    setSelectedDistrict(d);
    setSelectedCategory(categoryKey);
    setIsModalOpen(true);
  }, []);

  const handleRemove = useCallback((id: string | number) => {
    toggleFavorite({ id });
  }, [toggleFavorite]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setTimeout(() => {
      setSelectedDistrict(null);
      setSelectedCategory(null);
    }, 300);
  }, []);

  if (loading) return <Loader fullScreen />;

  if (!favorites.length) {
    return (
      <div className="text-center px-4 flex flex-col items-center justify-center min-h-[80vh] w-full">
        <div className="text-6xl mb-4 opacity-80">⭐</div>
        <h2 className="text-textMain font-heading mb-2 text-2xl font-bold">{t("favorites.status.empty_title")}</h2>
        <p className="text-textSecondary mb-6">{t("favorites.status.empty_desc")}</p>
        <button 
          className="px-9 py-3.5 rounded-xl border-none bg-accent text-white font-semibold font-heading uppercase tracking-[1px] cursor-pointer transition-all duration-250 hover:-translate-y-0.5 hover:shadow-[0_8px_16px_rgba(197,164,126,0.25)] hover:brightness-105" 
          onClick={() => navigate("/")}
        >
          {t("favorites.actions.go_to_map")}
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-8 py-8 min-h-[80vh]">
        <h1 className="text-center mb-10 text-[clamp(1.8rem,3vw,2.5rem)] font-bold text-textMain font-heading">
          {t("favorites.page_title")}
        </h1>
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paginatedFavorites.map((district) => (
            <FavoriteDistrictCard
              key={district.id}
              district={district}
              onClick={handleCardClick}
              onCategoryClick={handleCategoryClick}
              onRemove={handleRemove}
            />
          ))}
        </div>

        {totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center gap-4">
            <button 
              className="w-10 h-10 rounded-[10px] border border-borderClient bg-surface text-textMain cursor-pointer transition-all duration-200 flex items-center justify-center text-lg hover:not(:disabled):border-accent hover:not(:disabled):text-white hover:not(:disabled):bg-accent hover:not(:disabled):-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed" 
              disabled={currentPage === 1} 
              onClick={() => setCurrentPage(p => p - 1)}
            >
              ←
            </button>
            <span className="text-textMain font-medium">{currentPage} / {totalPages}</span>
            <button 
              className="w-10 h-10 rounded-[10px] border border-borderClient bg-surface text-textMain cursor-pointer transition-all duration-200 flex items-center justify-center text-lg hover:not(:disabled):border-accent hover:not(:disabled):text-white hover:not(:disabled):bg-accent hover:not(:disabled):-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed" 
              disabled={currentPage === totalPages} 
              onClick={() => setCurrentPage(p => p + 1)}
            >
              →
            </button>
          </div>
        )}
      </div>

      <DistrictDetailsModal
        district={selectedDistrict}
        selectedCategory={selectedCategory as any}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
}