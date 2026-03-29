import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FaExternalLinkAlt, FaMapMarkerAlt } from 'react-icons/fa';

const formatDate = (dateString, lang) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString(lang, {
    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
  });
};

export default function LastActivity({ lastActive, favoriteDistrict }) {
  const { t, i18n } = useTranslation('db');
  const navigate = useNavigate();

  const districtName = favoriteDistrict?.name || favoriteDistrict?.district;
  const districtCity = favoriteDistrict?.city || favoriteDistrict?.cities?.name;
  const districtCountry = favoriteDistrict?.country || favoriteDistrict?.cities?.countries?.name;

  const handleDistrictNavigate = () => {
    if (districtName && districtCity && districtCountry) {
      navigate(`/map/${encodeURIComponent(districtCountry)}/${encodeURIComponent(districtCity)}?district=${encodeURIComponent(districtName)}`);
    }
  };

  const formattedDate = lastActive ? formatDate(lastActive, i18n.language) : t('stats.stats_page.never');
  const hasValidDistrict = !!(districtName && districtCity && districtCountry);

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-6 md:gap-8">
      
      {/* Статус */}
      <div className="flex items-center gap-4 w-full md:w-auto pb-6 md:pb-0 border-b border-dashed border-borderClient md:border-none shrink-0">
        <div className="flex items-center justify-center w-6 h-6 shrink-0">
          <div className="w-2.5 h-2.5 bg-success rounded-full relative animate-[pulse-green_2s_infinite]"></div>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="font-heading font-semibold text-textMain text-[0.95rem] tracking-[0.02em]">
            {t('stats.stats_page.online')}
          </span>
          <span className="text-[0.85rem] text-textSecondary">
            {t('stats.stats_page.last_active_at', { time: formattedDate })}
          </span>
        </div>
      </div>

      {/* Вертикальна лінія (тільки на ПК) */}
      <div className="hidden md:block h-10 w-[1px] bg-borderClient opacity-60 shrink-0"></div>

      {/* Улюблений район */}
      <div className="flex items-center justify-between md:justify-end gap-4 w-full">
        <span className="text-[0.9rem] text-textSecondary font-medium shrink-0">
          {t('stats.stats_page.fav_district')}
        </span>
        {hasValidDistrict ? (
          <button 
            className="inline-flex items-center gap-2 px-4 py-2 bg-body border border-borderClient rounded-full cursor-pointer transition-all duration-200 text-textMain hover:border-accent hover:bg-surface hover:-translate-y-[1px] hover:shadow-sm group" 
            onClick={handleDistrictNavigate}
          >
            <FaMapMarkerAlt className="text-accent text-[0.9rem] shrink-0" />
            <span className="font-heading font-semibold text-[0.9rem] text-textMain truncate max-w-[150px] sm:max-w-[200px]">
              {districtName}
            </span>
            <FaExternalLinkAlt className="text-[0.7rem] text-textSecondary ml-1 opacity-70 group-hover:opacity-100 group-hover:text-accent transition-all shrink-0" />
          </button>
        ) : (
          <span className="italic text-textSecondary text-[0.9rem] shrink-0">
            {t('stats.stats_page.not_defined')}
          </span>
        )}
      </div>

      <style jsx>{`
        @keyframes pulse-green {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
      `}</style>
    </div>
  );
}