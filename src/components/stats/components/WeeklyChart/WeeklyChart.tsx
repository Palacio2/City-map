import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '@subscription/SubscriptionContext';
import { WeeklyActivityData } from '../../hooks/useStatsData';

interface WeeklyChartProps {
  data?: WeeklyActivityData[];
}

export default function WeeklyChart({ data = [] }: WeeklyChartProps) {
  const { t, i18n } = useTranslation('db');
  const { isRealtor } = useSubscription();

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map(item => {
      const dateObj = new Date(item.date);
      const dayLabel = dateObj.toLocaleDateString(i18n.language || 'uk-UA', { weekday: 'short' });
      return { ...item, dayLabel };
    });
  }, [data, i18n.language]);

  const scale = useMemo(() => {
    if (!chartData.length) return 1;
    const maxVal = Math.max(...chartData.map(d => 
      isRealtor ? Math.max(d.searches || 0, d.comparisons || 0) : d.searches || 0
    ));
    return maxVal > 0 ? 90 / maxVal : 1;
  }, [chartData, isRealtor]);

  return (
    <div className="w-full">
      <div className="flex justify-between gap-2 md:gap-3 mb-6 h-[220px] items-stretch pt-10 overflow-x-auto pb-2 custom-scrollbar">
        {chartData.length > 0 ? (
          chartData.map((day, index) => (
            <div key={index} className="flex flex-col-reverse items-center gap-3 flex-1 h-full relative min-w-[40px]">
              <div className="text-[0.75rem] md:text-[0.8rem] font-semibold text-textSecondary h-5 flex items-center justify-center uppercase tracking-widest shrink-0">
                {day.dayLabel}
              </div>
              <div className="flex items-end justify-center gap-1 md:gap-1.5 w-full flex-1 min-h-0 border-b border-dashed border-borderClient pb-1 relative">
                
                <div 
                  className="relative w-2.5 md:w-4 rounded-t-md transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] flex justify-center cursor-pointer bg-gradient-to-t from-accent to-accent-hover shadow-[0_0_10px_rgba(197,164,126,0.2)] hover:brightness-110 group" 
                  style={{ height: `${Math.max((day.searches || 0) * scale, 6)}%` }}
                >
                  <div className="absolute -top-[35px] left-1/2 -translate-x-1/2 translate-y-2.5 bg-textMain text-surface px-2 py-1 rounded text-xs font-semibold whitespace-nowrap opacity-0 invisible transition-all duration-200 pointer-events-none z-10 shadow-sm group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 after:content-[''] after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-solid after:border-t-textMain after:border-x-transparent after:border-b-transparent">
                    {t('stats.weekly_chart.searches')}: {day.searches}
                  </div>
                </div>

                {isRealtor && (
                  <div 
                    className="relative w-2.5 md:w-4 rounded-t-md transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] flex justify-center cursor-pointer bg-textSecondary hover:brightness-110 opacity-50 group" 
                    style={{ height: `${Math.max((day.comparisons || 0) * scale, 6)}%` }}
                  >
                    <div className="absolute -top-[35px] left-1/2 -translate-x-1/2 translate-y-2.5 bg-textMain text-surface px-2 py-1 rounded text-xs font-semibold whitespace-nowrap opacity-0 invisible transition-all duration-200 pointer-events-none z-10 shadow-sm group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 after:content-[''] after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-solid after:border-t-textMain after:border-x-transparent after:border-b-transparent">
                      {t('stats.weekly_chart.comparisons')}: {day.comparisons}
                    </div>
                  </div>
                )}

              </div>
            </div>
          ))
        ) : (
          <div className="w-full h-full flex items-center justify-center text-textSecondary italic text-sm">
            <p>{t('stats.weekly_chart.no_data')}</p>
          </div>
        )}
      </div>

      <div className="flex gap-6 justify-center flex-wrap pt-4">
        <div className="flex items-center gap-2 text-sm text-textSecondary font-medium">
          <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-accent to-accent-hover shadow-[0_0_5px_rgba(197,164,126,0.4)]" />
          <span>{t('stats.weekly_chart.legend_searches')}</span>
        </div>
        {isRealtor && (
          <div className="flex items-center gap-2 text-sm text-textSecondary font-medium">
            <div className="w-2.5 h-2.5 rounded-full bg-textSecondary opacity-50" />
            <span>{t('stats.weekly_chart.legend_comparisons')}</span>
          </div>
        )}
      </div>
    </div>
  );
}