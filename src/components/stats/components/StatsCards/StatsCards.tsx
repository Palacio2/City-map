import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { FaSearch, FaMap, FaChartLine, FaClock } from 'react-icons/fa';
import { DashboardStats } from '@stats/hooks/useStatsData';

const formatDuration = (seconds: number | undefined, t: TFunction) => {
  if (!seconds) return `0 ${t('stats.labels.hours')} 0 ${t('stats.labels.minutes')}`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours} ${t('stats.labels.hours')} ${minutes} ${t('stats.labels.minutes')}`;
};

interface StatsCardsProps {
  stats: DashboardStats | null;
  onSearchesClick: () => void;
  onSavedClick: () => void;
  onCompareClick: () => void;
  showCompare: boolean;
}

export default function StatsCards({ stats, onSearchesClick, onSavedClick, onCompareClick, showCompare }: StatsCardsProps) {
  const { t } = useTranslation('db');

  const cards = [
    { 
      icon: FaSearch, 
      colorClass: 'bg-primary/10 text-primary border-primary/20', 
      label: t('stats.cards.searches'), 
      value: stats?.viewedDistricts || 0,
      onClick: onSearchesClick,
      hidden: false
    },
    { 
      icon: FaMap, 
      colorClass: 'bg-success/10 text-success border-success/20', 
      label: t('stats.cards.saved'), 
      value: stats?.savedDistricts || 0,
      onClick: onSavedClick,
      hidden: false
    },
    { 
      icon: FaChartLine, 
      colorClass: 'bg-accent/10 text-accent border-accent/20', 
      label: t('stats.cards.comparisons'),
      value: stats?.comparisons || 0,
      onClick: onCompareClick,
      hidden: !showCompare
    },
    { 
      icon: FaClock, 
      colorClass: 'bg-warning/10 text-warning border-warning/20', 
      label: t('stats.cards.time'), 
      value: formatDuration(stats?.totalTime || 0, t),
      onClick: undefined,
      hidden: false
    },
  ];

  const visibleCards = cards.filter(card => !card.hidden);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 w-full">
      {visibleCards.map((item) => (
        <div 
          key={item.label}
          className={`bg-surface rounded-2xl p-4 sm:p-5 md:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 md:gap-5 border border-borderClient transition-all shadow-xs hover:shadow-md dark:bg-white/5 dark:border-white/10 overflow-hidden relative ${item.onClick ? 'cursor-pointer hover:-translate-y-1 hover:border-accent dark:hover:bg-white/10 dark:hover:border-accent dark:hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] group' : ''}`}
          onClick={item.onClick}
        >
          <div className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center text-lg sm:text-xl md:text-2xl shrink-0 transition-transform duration-300 border ${item.colorClass} ${item.onClick ? 'group-hover:scale-110' : ''}`}>
            <item.icon />
          </div>
          <div className="flex flex-col gap-0.5 md:gap-1 mt-1 sm:mt-0">
            <span className="font-heading text-xl sm:text-2xl md:text-3xl font-bold text-textMain leading-none md:leading-tight">{item.value}</span>
            <span className="text-[0.65rem] sm:text-xs md:text-[0.85rem] text-textSecondary font-semibold uppercase tracking-wider md:tracking-widest">{item.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
