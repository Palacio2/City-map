import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CloseButton, FavoriteButton, CommentButton } from './Buttons';
import { FiDownload, FiUsers, FiBriefcase, FiTrendingUp, FiHome, FiDollarSign, FiMap } from 'react-icons/fi';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { useFavorites } from '@pages/favorites/FavoritesContext';
import { Button } from '@ui/Button';
import { TransformedDistrict, TransformedFilterData, GeneralStats } from '@utils/dataTransformers'; 
import { CurrencyInfo } from '@utils/formatters';

const getStatIcon = (key: keyof GeneralStats) => {
  switch (key) {
    case 'population': return <FiUsers />;
    case 'unemploymentRate': return <FiTrendingUp />;
    case 'averageSalary': return <FiBriefcase />;
    case 'propertyPrice': return <FiHome />;
    case 'average_rent_price': return <FiDollarSign />;
    default: return <FiTrendingUp />;
  }
};

interface HeaderSectionProps {
  district?: TransformedDistrict | null;
  updatedAt?: string | null;
  filterData?: TransformedFilterData | null;
  onClose: () => void;
  formatNumber: (val: any) => string;
  formatPrice: (val: any, info?: CurrencyInfo) => string;
  isRealtor?: boolean;
  onDownloadPdf: () => void;
  isDownloading?: boolean;
  isFree?: boolean;
  currencyInfo?: CurrencyInfo;
  onOpenMap: () => void;
}

export const HeaderSection: React.FC<HeaderSectionProps> = ({
  district,
  updatedAt,
  filterData,
  onClose,
  formatNumber,
  formatPrice,
  isRealtor,
  onDownloadPdf,
  isDownloading,
  isFree,
  currencyInfo,
  onOpenMap
}) => {
  const { t, i18n } = useTranslation('db');

  const { isFavorite, toggleFavorite } = useFavorites() as { 
    isFavorite: (id: string | number) => boolean; 
    toggleFavorite: (districtData: any) => Promise<void> 
  };

  const isFav = useMemo(() => {
    return district && district.id ? isFavorite(String(district.id)) : false;
  }, [district, isFavorite]);

  const formattedDate = useMemo(() => {
    if (!district) return null;
    const dateToFormat = updatedAt || district.updated_at;
    return dateToFormat
      ? new Date(dateToFormat).toLocaleDateString(i18n.language, {
          day: '2-digit', month: '2-digit', year: 'numeric'
        })
      : null;
  }, [updatedAt, district, i18n.language]);

  const quickStatsConfig: Array<{ key: keyof GeneralStats; label: string; formatter: (val: any) => any }> = useMemo(() => [
    { key: 'population', label: 'details.population', formatter: formatNumber },
    { key: 'averageSalary', label: 'details.salary', formatter: (val) => formatPrice?.(val, currencyInfo) ?? val },
    { key: 'unemploymentRate', label: 'details.unemployment', formatter: (val) => `${val}%` },
    { key: 'propertyPrice', label: 'common.fields.propertyPricePerSqm', formatter: (val) => formatPrice?.(val, currencyInfo) ?? val },
    { key: 'average_rent_price', label: 'common.fields.average_rent_price', formatter: (val) => formatPrice?.(val, currencyInfo) ?? val }
  ], [formatNumber, formatPrice, currencyInfo]);

  if (!district) return null;

  const { name, photo_url } = district;
  
  const handleHeartClick = async () => {
    if (district) {
      await toggleFavorite(district); 
    }
  };

  return (
    <>
      <div className="relative h-[260px] md:h-[420px] bg-slate-900 shrink-0 overflow-hidden flex flex-col rounded-t-3xl md:rounded-t-[var(--radius-lg)]">
         {photo_url && (
           <div className="absolute inset-0 z-0">
              <img src={photo_url} alt={name} className="w-full h-full object-cover animate-slowZoom" />
              {/* Легший градієнт зверху для кнопок, темніший знизу для тексту */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/10 via-30% to-black/95 to-100%" />
           </div>
         )}
        
        <div className="relative z-10 flex-1 p-4 pt-4 md:p-8 md:pt-[max(2rem,env(safe-area-inset-top))] flex flex-col text-white justify-between">
          
          {/* Верхній блок: Дата (тільки ПК) та Кнопки */}
          <div className="flex justify-between items-start w-full">
            {/* Дата на ПК висить зліва */}
            <div className="hidden md:inline-flex items-center gap-2 bg-black/50 backdrop-blur-md px-3.5 py-1.5 rounded-full font-body text-[0.75rem] font-medium text-white/90 border border-white/20 shadow-sm">
              <span className="w-1.5 h-1.5 bg-success rounded-full shadow-[0_0_8px_var(--success-color)]"></span>
              {t('stats.updated_label')}: {formattedDate}
            </div>
            <div className="md:hidden"></div> {/* Пустий блок для Flexbox */}

            <div className="flex gap-2 flex-nowrap">
              <button
                className="bg-black/30 backdrop-blur-[var(--glass-blur)] border border-white/20 w-8 h-8 md:w-[44px] md:h-[44px] rounded-full flex items-center justify-center text-white cursor-pointer transition-all duration-300 ease-out shrink-0 p-0 shadow-sm hover:bg-black/50 hover:border-accent hover:text-accent hover:-translate-y-0.5 hover:shadow-md [&>svg]:w-4 [&>svg]:h-4 md:[&>svg]:w-5 md:[&>svg]:h-5 [&>svg]:drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                onClick={onOpenMap}
                title={t('actions.view_map')}
              >
                <FiMap />
              </button>

              {!isFree && (
                <>
                  <button
                    className="bg-black/30 backdrop-blur-[var(--glass-blur)] border border-white/20 w-8 h-8 md:w-[44px] md:h-[44px] rounded-full flex items-center justify-center text-white cursor-pointer transition-all duration-300 ease-out shrink-0 p-0 shadow-sm hover:bg-black/50 hover:border-accent hover:text-accent hover:-translate-y-0.5 hover:shadow-md [&>svg]:w-4 [&>svg]:h-4 md:[&>svg]:w-5 md:[&>svg]:h-5 [&>svg]:drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                    onClick={onDownloadPdf}
                    disabled={isDownloading}
                    title={t('actions.download_pdf')}
                  >
                    {isDownloading ? <AiOutlineLoading3Quarters className="animate-spin text-[16px] md:text-xl" /> : <FiDownload />}
                  </button>

                  <FavoriteButton
                    isFavorite={isFav}
                    onToggle={handleHeartClick}
                  />

                  {/* Кнопка Коментарів */}
                  <CommentButton 
                    onClick={() => console.log('Comments clicked')}
                    count={0} 
                  />
                </>
              )}
              <CloseButton onClose={onClose} />
            </div>
          </div>

          {/* Нижній блок: Заголовок, Дата (моб) та Quick Stats */}
          <div className="flex flex-col gap-2 md:gap-4 mt-auto">
            <div>
              <h1 className="font-heading text-[1.75rem] md:text-[3rem] font-semibold m-0 leading-[1.1] tracking-tight text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                {name}
              </h1>
              {/* Дата на мобільному телефоні під заголовком */}
              {formattedDate && (
                <div className="md:hidden mt-1.5 inline-flex items-center gap-1.5 bg-black/40 px-2 py-0.5 rounded-full font-body text-[0.65rem] text-white/80 border border-white/10">
                  <span className="w-1.5 h-1.5 bg-success rounded-full"></span>
                  {t('stats.updated_label')} {formattedDate}
                </div>
              )}
            </div>
            
            {isRealtor && filterData?.general && (
              <div className="flex overflow-x-auto pb-2 gap-3 w-[calc(100%+1rem)] md:w-full -mx-2 px-2 md:mx-0 md:px-0 scrollbar-thin scrollbar-thumb-white/30 hover:scrollbar-thumb-white/50 scrollbar-track-transparent">
                {quickStatsConfig.map(({ key, label, formatter }) => {
                  const value = filterData.general[key];
                  if (value === undefined || value === null) return null;

                  return (
                    <div key={key} className="min-w-[130px] md:min-w-[180px] flex-none bg-white/10 backdrop-blur-md border border-white/15 rounded-md p-2.5 md:py-3 md:px-4 flex items-center gap-2.5 md:gap-3 transition-all hover:bg-white/20">
                      <div className="flex items-center justify-center w-7 h-7 md:w-8 md:h-8 bg-white/10 rounded-md text-accent shrink-0">
                        {getStatIcon(key)}
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-[0.65rem] md:text-[0.7rem] uppercase text-white/70 tracking-widest whitespace-nowrap overflow-hidden text-ellipsis mb-0.5">
                          {t(label)}
                        </span>
                        <span className="font-body text-[0.85rem] md:text-[0.95rem] font-semibold text-white whitespace-nowrap">
                            {formatter ? formatter(value) : value}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes slowZoom { from { transform: scale(1); } to { transform: scale(1.15); } }
        .animate-slowZoom { animation: slowZoom 45s infinite alternate ease-in-out; }
        @keyframes swipeHint {
          0% { transform: translateX(0); }
          20% { transform: translateX(-15px); }
          40% { transform: translateX(0); }
          100% { transform: translateX(0); }
        }
        .animate-swipeHint { animation: swipeHint 1.2s ease-out 0.5s; }
      `}</style>
    </>
  );
};

interface ModalFooterProps {
  onClose: () => void;
}

export const ModalFooter: React.FC<ModalFooterProps> = ({ onClose }) => {
  const { t } = useTranslation('db');
  return (
    <div className="p-4 md:p-6 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-[var(--border-color)] bg-[var(--bg-surface)] flex justify-end rounded-b-3xl md:rounded-b-[var(--radius-lg)]">
      <Button variant="outlineDanger" onClick={onClose} className="w-full md:w-auto px-8 transition-all duration-300">
        {t('actions.close')}
      </Button>
    </div>
  );
};