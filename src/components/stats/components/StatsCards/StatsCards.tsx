import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaSearch, FaMap, FaChartLine, FaClock } from 'react-icons/fa';
// ВИПРАВЛЕНО: Додано правильний шлях імпорту (два рівня вгору)
import { DashboardStats } from '../../hooks/useStatsData';

// ОНОВЛЕНО: Використовуємо безпечні ключі page_stats
const formatDuration = (seconds: number | undefined, t: any) => {
  if (!seconds) return `0 ${t('page_stats.hours')} 0 ${t('page_stats.minutes')}`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours} ${t('page_stats.hours')} ${minutes} ${t('page_stats.minutes')}`;
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
      colorClass: 'bg-[#4299e1]/10 text-[#4299e1] border-[#4299e1]/20', 
      label: t('page_stats.searches'), 
      value: stats?.viewed_districts_count || stats?.viewedDistricts || 0,
      onClick: onSearchesClick,
      hidden: false
    },
    { 
      icon: FaMap, 
      colorClass: 'bg-success/10 text-success border-success/20', 
      label: t('page_stats.saved_districts'), 
      value: stats?.savedDistricts || 0,
      onClick: onSavedClick,
      hidden: false
    },
    { 
      icon: FaChartLine, 
      colorClass: 'bg-[#9f7aea]/10 text-[#9f7aea] border-[#9f7aea]/20', 
      label: t('page_stats.comparisons'), // ОНОВЛЕНО
      value: stats?.comparisons || 0,
      onClick: onCompareClick,
      hidden: !showCompare
    },
    { 
      icon: FaClock, 
      colorClass: 'bg-warning/10 text-warning border-warning/20', 
      label: t('page_stats.time_spent'), 
      value: formatDuration(stats?.total_time_seconds || stats?.totalTime || 0, t),
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
          className={`bg-surface p-3.5 sm:p-5 md:p-6 rounded-xl md:rounded-2xl shadow-sm md:shadow-card border border-borderClient flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 md:gap-5 transition-all overflow-hidden relative ${item.onClick ? 'cursor-pointer hover:-translate-y-1 hover:shadow-hover hover:border-accent group' : ''}`}
          onClick={item.onClick}
        >
          <div className={`w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-base sm:text-xl md:text-2xl shrink-0 transition-transform duration-300 border ${item.colorClass} ${item.onClick ? 'group-hover:scale-110' : ''}`}>
            <item.icon />
          </div>
          <div className="flex flex-col gap-0.5 md:gap-1 mt-1 sm:mt-0">
            <span className="font-heading text-lg sm:text-2xl md:text-[1.5rem] font-bold text-textMain leading-none md:leading-tight">{item.value}</span>
            <span className="text-[0.65rem] sm:text-xs md:text-[0.85rem] text-textSecondary font-semibold uppercase tracking-wider md:tracking-widest">{item.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}