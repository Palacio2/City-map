import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaSearch, FaMap, FaChartLine, FaClock } from 'react-icons/fa';

const formatDuration = (seconds, t) => {
  if (!seconds) return `0 ${t('stats.stats_page.hours')} 0 ${t('stats.stats_page.minutes')}`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours} ${t('stats.stats_page.hours')} ${minutes} ${t('stats.stats_page.minutes')}`;
};

export default function StatsCards({ stats, onSearchesClick, onSavedClick, onCompareClick, showCompare }) {
  const { t } = useTranslation('db');

  const cards = [
    { 
      icon: FaSearch, 
      colorClass: 'bg-[#4299e1]/10 text-[#4299e1] border-[#4299e1]/20', 
      label: t('stats.stats_page.searches'), 
      value: stats?.viewed_districts_count || stats?.viewedDistricts || 0,
      onClick: onSearchesClick
    },
    { 
      icon: FaMap, 
      colorClass: 'bg-success/10 text-success border-success/20', 
      label: t('stats.stats_page.saved_districts'), 
      value: stats?.savedDistricts || 0,
      onClick: onSavedClick
    },
    { 
      icon: FaChartLine, 
      colorClass: 'bg-[#9f7aea]/10 text-[#9f7aea] border-[#9f7aea]/20', 
      label: t('stats.stats_page.comparisons'), 
      value: stats?.comparisons || 0,
      onClick: onCompareClick,
      hidden: !showCompare
    },
    { 
      icon: FaClock, 
      colorClass: 'bg-warning/10 text-warning border-warning/20', 
      label: t('stats.stats_page.time_spent'), 
      value: formatDuration(stats?.total_time_seconds || stats?.totalTime || 0, t),
      onClick: null
    },
  ];

  const visibleCards = cards.filter(card => !card.hidden);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 w-full">
      {visibleCards.map((item, index) => (
        <div 
          key={index} 
          className={`bg-surface p-3.5 sm:p-5 md:p-6 rounded-xl md:rounded-2xl shadow-sm md:shadow-card border border-borderClient flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 md:gap-5 transition-all overflow-hidden relative ${item.onClick ? 'cursor-pointer hover:-translate-y-1 hover:shadow-hover hover:border-accent group' : ''}`}
          onClick={item.onClick}
        >
          {/* Зменшено іконки на мобільних (w-9 h-9) */}
          <div className={`w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-base sm:text-xl md:text-2xl shrink-0 transition-transform duration-300 border ${item.colorClass} ${item.onClick ? 'group-hover:scale-110' : ''}`}>
            <item.icon />
          </div>
          <div className="flex flex-col gap-0.5 md:gap-1 mt-1 sm:mt-0">
            {/* Адаптивні шрифти для цифр та підписів */}
            <span className="font-heading text-lg sm:text-2xl md:text-[1.5rem] font-bold text-textMain leading-none md:leading-tight">{item.value}</span>
            <span className="text-[0.65rem] sm:text-xs md:text-[0.85rem] text-textSecondary font-semibold uppercase tracking-wider md:tracking-widest">{item.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}