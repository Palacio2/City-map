import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CloseButton, FavoriteButton } from './Buttons';
import { FiDownload, FiUsers, FiBriefcase, FiTrendingUp, FiHome, FiDollarSign, FiMap } from 'react-icons/fi';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { useFavorites } from '@pages/favorites/FavoritesContext';

const getStatIcon = (key) => {
  switch (key) {
    case 'population': return <FiUsers />;
    case 'unemploymentRate': return <FiTrendingUp />;
    case 'averageSalary': return <FiBriefcase />;
    case 'propertyPrice': return <FiHome />;
    case 'average_rent_price': return <FiDollarSign />;
    default: return <FiTrendingUp />;
  }
};

export function HeaderSection({
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
}) {
  const { t, i18n } = useTranslation(['districts', 'common']);
  const { isFavorite, toggleFavorite } = useFavorites();

  const isFav = useMemo(() => {
    return district ? isFavorite(district.id) : false;
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

  const quickStatsConfig = useMemo(() => [
    { key: 'population', label: 'districts:details.population', formatter: formatNumber },
    { key: 'averageSalary', label: 'districts:details.salary', formatter: (val) => formatPrice ? formatPrice(val, currencyInfo) : val },
    { key: 'unemploymentRate', label: 'districts:details.unemployment', formatter: (val) => `${val}%` },
    { key: 'propertyPrice', label: 'districts:details.price', formatter: (val) => formatPrice ? formatPrice(val, currencyInfo) : val },
    { key: 'average_rent_price', label: 'districts:pdf.rent', formatter: (val) => formatPrice ? formatPrice(val, currencyInfo) : val }
  ], [formatNumber, formatPrice, currencyInfo]);

  if (!district) return null;

  const { name, photo_url } = district;
  
  const handleHeartClick = async () => {
    await toggleFavorite(district);
  };

  return (
    <>
      <div className="relative min-h-[auto] md:min-h-[420px] h-auto bg-slate-900 shrink-0 overflow-hidden flex flex-col rounded-t-[24px] md:rounded-none">
         {photo_url && (
           <div className="absolute inset-0 z-0">
              <img src={photo_url} alt={name} className="w-full h-full object-cover animate-slowZoom" />
              <div className="absolute inset-0 bg-gradient-to-b from-[#0f101466] via-[#0f101433] via-40% to-[#0f1014fa] to-100%" />
           </div>
         )}
        
        <div className="relative z-10 flex-1 p-5 pt-6 md:p-8 md:pt-[max(2rem,env(safe-area-inset-top))] flex flex-col text-white gap-6 md:gap-0">
          <div className="flex justify-end items-start mb-4 md:mb-0">
             <div className="flex gap-2 md:gap-3 flex-nowrap">
               <button
                 className="bg-black/30 backdrop-blur-[var(--glass-blur)] border border-white/20 w-9 h-9 md:w-[44px] md:h-[44px] rounded-full flex items-center justify-center text-white cursor-pointer transition-all shrink-0 p-0 box-border shadow-sm hover:bg-black/50 hover:border-accent hover:text-accent hover:-translate-y-0.5 hover:shadow-md [&>svg]:w-[18px] [&>svg]:h-[18px] md:[&>svg]:w-5 md:[&>svg]:h-5 [&>svg]:drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                 onClick={onOpenMap}
                 title={t('common:actions.view_map')}
               >
                 <FiMap />
               </button>

               {!isFree && (
                 <>
                   <button
                     className="bg-black/30 backdrop-blur-[var(--glass-blur)] border border-white/20 w-9 h-9 md:w-[44px] md:h-[44px] rounded-full flex items-center justify-center text-white cursor-pointer transition-all shrink-0 p-0 box-border shadow-sm hover:bg-black/50 hover:border-accent hover:text-accent hover:-translate-y-0.5 hover:shadow-md [&>svg]:w-[18px] [&>svg]:h-[18px] md:[&>svg]:w-5 md:[&>svg]:h-5 [&>svg]:drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                     onClick={onDownloadPdf}
                     disabled={isDownloading}
                     title={t('common:actions.download_pdf')}
                   >
                     {isDownloading ? <AiOutlineLoading3Quarters className="animate-spin text-[18px] md:text-xl" /> : <FiDownload />}
                   </button>

                   <FavoriteButton
                     isFavorite={isFav}
                     onToggle={handleHeartClick}
                   />
                 </>
               )}
               <CloseButton onClose={onClose} />
             </div>
          </div>

          <div className="mt-auto mb-4 md:mb-8">
            <h1 className="font-heading text-[2rem] md:text-[3rem] font-semibold m-0 leading-[1.2] md:leading-[1.1] tracking-tight text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)]">{name}</h1>
          </div>
          
          {isRealtor && filterData?.general && (
            <div className="flex overflow-x-auto pb-2 md:pb-3 gap-4 w-[calc(100%+2.5rem)] md:w-full -mx-5 px-5 md:mx-0 md:px-0 scrollbar-hide md:custom-scrollbar" style={{ WebkitMaskImage: 'linear-gradient(to right, black 85%, transparent 100%)', maskImage: 'linear-gradient(to right, black 85%, transparent 100%)' }}>
              {quickStatsConfig.map(({ key, label, formatter }) => {
                const value = filterData.general[key];
                if (value === undefined || value === null || (typeof value === 'number' && value <= 0)) return null;

                return (
                  <div key={key} className="min-w-[140px] md:min-w-[180px] flex-none bg-white/15 md:bg-white/10 backdrop-blur-md border border-white/15 rounded-md p-3 md:py-3 md:px-4 flex items-center gap-3 transition-all hover:bg-white/20 hover:border-white/30 shadow-[0_4px_10px_rgba(0,0,0,0.1)] md:shadow-none animate-swipeHint md:animate-none">
                    <div className="flex items-center justify-center w-8 h-8 bg-white/10 rounded-md text-accent shrink-0">
                      {getStatIcon(key)}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-[0.7rem] uppercase text-white/70 tracking-widest whitespace-nowrap overflow-hidden text-ellipsis mb-0.5">{t(label)}</span>
                      <span className="font-body text-[0.95rem] font-semibold text-white whitespace-nowrap">
                          {formatter ? formatter(value) : value}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {formattedDate && (
              <div className="mt-2 md:mt-0 self-start md:absolute md:top-[max(2rem,env(safe-area-inset-top))] md:left-8 inline-flex items-center gap-2 bg-black/50 md:bg-black/60 backdrop-blur-md px-2.5 py-1 md:px-3.5 md:py-1.5 rounded-full font-body text-[0.7rem] md:text-[0.75rem] font-medium text-white/90 border border-white/20 whitespace-nowrap shadow-sm">
                <span className="w-1.5 h-1.5 bg-success rounded-full shadow-[0_0_8px_var(--success-color)]"></span>
                {t('districts:details.updated')}: {formattedDate}
              </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes slowZoom { from { transform: scale(1); } to { transform: scale(1.15); } }
        .animate-slowZoom { animation: slowZoom 45s infinite alternate ease-in-out; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
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
}

export function ModalFooter({ onClose }) {
  const { t } = useTranslation('common');
  return (
    <div className="p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] border-t border-borderClient bg-surface flex justify-end">
      <button 
        className="py-3 px-8 rounded-lg bg-transparent border border-borderClient text-textSecondary font-heading text-[0.85rem] font-semibold uppercase tracking-widest cursor-pointer transition-all hover:border-accent hover:text-accent hover:bg-hover" 
        onClick={onClose}
      >
        {t('actions.close')}
      </button>
    </div>
  );
}