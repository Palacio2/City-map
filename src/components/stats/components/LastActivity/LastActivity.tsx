import type { FavoriteDistrictData } from '../../types';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FaExternalLinkAlt, FaMapMarkerAlt } from 'react-icons/fa';

const formatDate = (dateString?: string | null, lang: string = 'uk-UA') => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString(lang, {
    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
  });
};

interface LastActivityProps {
  lastActive?: string | null;
  favoriteDistrict?: FavoriteDistrictData;
}

export default function LastActivity({ lastActive, favoriteDistrict }: LastActivityProps) {
  const { t, i18n } = useTranslation('db');
  const navigate = useNavigate();
  const districtName = favoriteDistrict?.name || favoriteDistrict?.district;
  const districtCity = favoriteDistrict?.city;
  const districtCountry = favoriteDistrict?.country;

  const handleDistrictNavigate = () => {
    if (districtName && districtCity && districtCountry) {
      navigate(`/map/${encodeURIComponent(districtCountry)}/${encodeURIComponent(districtCity)}?district=${encodeURIComponent(districtName)}`);
    }
  };

  const formattedDate = lastActive ? formatDate(lastActive, i18n.language) : t('stats.last_activity.never');
  const hasValidDistrict = !!(districtName && districtCity && districtCountry);

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8 w-full p-2">
      <div className="flex flex-col gap-1 md:gap-1.5 min-w-0">
        <span className="text-[0.7rem] md:text-xs uppercase tracking-widest text-textSecondary font-semibold">
          {t('stats.last_activity.last_visit')}
        </span>
        <span className="font-heading text-lg md:text-xl font-bold text-textMain truncate">
          {formattedDate}
        </span>
      </div>

      <div className="hidden md:block w-px h-10 bg-borderClient dark:bg-white/10 shrink-0" />

      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 border-t sm:border-none border-borderClient dark:border-white/10 pt-3 sm:pt-0">
        <span className="text-[0.9rem] text-textSecondary font-medium shrink-0">
          {t('stats.last_activity.fav_district')}
        </span>
        {hasValidDistrict ? (
          <button 
            className="inline-flex items-center gap-2 px-4 py-2 bg-body dark:bg-white/5 border border-borderClient dark:border-white/10 rounded-full cursor-pointer transition-all duration-200 text-textMain hover:border-accent hover:bg-surface dark:hover:bg-white/10 hover:-translate-y-[1px] hover:shadow-xs group" 
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
            {t('stats.last_activity.not_defined')}
          </span>
        )}
      </div>
    </div>
  );
}
