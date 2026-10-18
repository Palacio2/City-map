import { useState, useMemo, memo } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FaShieldAlt, 
  FaGraduationCap, 
  FaPlusSquare, 
  FaShoppingCart, 
  FaBus, 
  FaLeaf, 
  FaCoins, 
  FaHeart
} from 'react-icons/fa';
import type { DistrictCardProps } from '../types';

const getCategoryIcon = (key: string, fallbackIcon?: string): ReactNode => {
  const normalized = key.toLowerCase();
  if (normalized.includes('safe') || normalized.includes('crime') || normalized.includes('безпек')) return <FaShieldAlt />;
  if (normalized.includes('edu') || normalized.includes('school') || normalized.includes('освіт')) return <FaGraduationCap />;
  if (normalized.includes('health') || normalized.includes('med') || normalized.includes('медиц')) return <FaPlusSquare />;
  if (normalized.includes('shop') || normalized.includes('market') || normalized.includes('com') || normalized.includes('магаз') || normalized.includes('торг')) return <FaShoppingCart />;
  if (normalized.includes('trans') || normalized.includes('bus') || normalized.includes('транспорт')) return <FaBus />;
  if (normalized.includes('eco') || normalized.includes('nature') || normalized.includes('green') || normalized.includes('екол')) return <FaLeaf />;
  if (normalized.includes('econ') || normalized.includes('price') || normalized.includes('цін') || normalized.includes('економ')) return <FaCoins />;
  if (normalized.includes('life') || normalized.includes('general')) return <FaHeart />;
  
  return fallbackIcon ? <span className="text-xs leading-none">{fallbackIcon}</span> : <FaShieldAlt />;
};

export const DistrictCard = memo(({ district, onClick, isPriority = false }: DistrictCardProps) => {
  const { t } = useTranslation('db');
  const [imgError, setImgError] = useState(false);
  const filterData = district.filterData;



  const visibleStats = useMemo(() => {
    if (!filterData) return [];
    return Object.keys(filterData)
      .filter(k => k !== 'general')
      .map(key => {
        const catData = filterData[key] as { key?: string; icon?: string; rating?: number };
        if (!catData || !('rating' in catData)) return null;
        return {
          key: catData.key as string,
          icon: catData.icon || '',
          rating: Number(catData.rating) || 0
        };
      })
      .filter((item): item is { key: string; icon: string; rating: number } => Boolean(item));
  }, [filterData]);

  const avgScore = useMemo(() => {
    if (!visibleStats.length) return null;
    const sum = visibleStats.reduce((acc, s) => acc + s.rating, 0);
    return (sum / visibleStats.length).toFixed(1);
  }, [visibleStats]);

  const getScoreClasses = (score: number) => {
    if (score >= 8.0) {
      return 'text-teal-700 bg-teal-50 border-teal-200 dark:text-cyan-400 dark:bg-cyan-950/40 dark:border-cyan-500/30';
    }
    if (score >= 5.5) {
      return 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/40 dark:border-amber-500/30';
    }
    return 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-950/40 dark:border-rose-500/30';
  };

  const getTranslatedLabel = (key: string) => {
    return t([
      `district.categories.${key}`,
      `common.categories.${key}`,
      `groups.${key}`,
      `common.fields.${key}`,
      key
    ], { defaultValue: key });
  };

  return (
    <article
      className="group relative flex flex-col justify-between bg-surface dark:bg-[#141b26] border border-borderClient dark:border-white/10 rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer shadow-xs hover:shadow-hover hover:border-primary dark:hover:border-primary transition-all duration-300 focus:outline-hidden focus:ring-2 focus:ring-primary"
      onClick={() => onClick(district)}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(district);
        }
      }}
      aria-label={`${t('district.card.view_details')} ${district.name}`}
    >
      {/* Медіа блок */}
      <div className="relative aspect-[16/10] w-full bg-[#141b26] overflow-hidden shrink-0">
        {district.photo_url && !imgError ? (
          <img
            src={district.photo_url}
            alt={district.name}
            className="block w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110 origin-center"
            loading={isPriority ? 'eager' : 'lazy'}
            // @ts-expect-error React 18.2 requires lowercase fetchpriority for DOM node
            fetchpriority={isPriority ? 'high' : 'auto'}
            width="320"
            height="200"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl sm:text-3xl bg-hover text-textSecondary select-none">
            🏙️
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/20" />

        {/* Бейдж рейтингу на фото */}
        {avgScore && (
          <div className="absolute top-2 right-2 px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-lg backdrop-blur-md bg-black/60 border border-white/20 text-white font-bold text-[10px] sm:text-xs flex items-center gap-1 shadow-md">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
            <span className="tracking-tight">{avgScore}</span>
          </div>
        )}

      </div>

      {/* Нижня частина: Варіант 2 (Топ-2 переваги) */}
      <div className="p-3 sm:p-4 bg-surface dark:bg-[#141b26] flex flex-col flex-1">
        <h3
          title={district.name}
          className="font-heading font-bold text-sm sm:text-base md:text-lg text-textMain tracking-tight truncate m-0 mb-3"
        >
          {district.name}
        </h3>
        
        <div className="flex flex-col gap-1.5 mt-auto border-t border-borderClient/50 pt-3">
          {(() => {
            const topStats = [...visibleStats].sort((a, b) => b.rating - a.rating).slice(0, 2);

            if (topStats.length === 0) {
              return (
                <div className="text-xs text-textSecondary text-center italic py-1">
                  {t('district.status.no_data', { defaultValue: '—' })}
                </div>
              );
            }

            return (
              <>
                <span className="text-[10px] uppercase tracking-wider text-textMuted font-bold mb-1">
                  {t('district.card.top_features', 'Топ переваги')}
                </span>
                {topStats.map((stat) => (
                  <div key={stat.key} className="flex items-center justify-between text-xs sm:text-[13px] bg-hover dark:bg-white/5 px-2.5 py-1.5 rounded-lg group/item">
                    <span className="text-textSecondary flex items-center gap-2 truncate group-hover/item:text-textMain transition-colors">
                      <span className="text-accent">{getCategoryIcon(stat.key, stat.icon)}</span>
                      <span className="truncate">{getTranslatedLabel(stat.key)}</span>
                    </span>
                    <span className={`font-bold shrink-0 ml-2 ${getScoreClasses(stat.rating).split(' ')[0]}`}>
                      {stat.rating.toFixed(1)}
                    </span>
                  </div>
                ))}
              </>
            );
          })()}
        </div>
      </div>
    </article>
  );
});

DistrictCard.displayName = 'DistrictCard';