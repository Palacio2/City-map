import React, { useState, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaChevronDown, FaChartBar, FaMapMarkerAlt, FaHistory, FaBookmark, FaCalculator } from 'react-icons/fa';
import { useSubscription } from '@/pages/subscription/contex/SubscriptionContext';
import { FEATURES_CONFIG } from '@/config/features';
import StatsCards from './components/StatsCards/StatsCards';
import { RequireSubscription } from '@/shared/components/guards';
import WeeklyChart from './components/WeeklyChart/WeeklyChart';
import PopularDistricts from './components/PopularDistricts/PopularDistricts';
import TrackedDistricts from './components/TrackedDistricts/TrackedDistricts';
import LastActivity from './components/LastActivity/LastActivity';
import InvestmentCalculator from './components/InvestmentCalculato/InvestmentCalculator';
import { DashboardStats, WeeklyActivityData } from './hooks/useStatsData';

const STORAGE_KEY = 'stats_page_sections_state';

interface CollapsibleSectionProps {
  id: string;
  title: string;
  icon?: React.ElementType;
  children: ReactNode;
  isOpen: boolean;
  onToggle: (id: string) => void;
}

const CollapsibleSection = React.memo(({ id, title, icon: Icon, children, isOpen, onToggle }: CollapsibleSectionProps) => {
  return (
    <div className={`w-full bg-surface rounded-2xl shadow-sm border overflow-hidden transition-all duration-300 ${isOpen ? 'shadow-md border-accent' : 'border-borderClient'}`}>
      <button 
        className="w-full flex items-center justify-between p-5 md:p-6 bg-surface border-none cursor-pointer transition-colors hover:bg-hover text-left" 
        onClick={() => onToggle(id)}
        aria-expanded={isOpen}
      >
        <div className={`flex items-center gap-3 md:gap-4 text-base md:text-[1.1rem] font-semibold font-heading uppercase tracking-wide transition-colors ${isOpen ? 'text-accent' : 'text-textMain'}`}>
          {Icon && <Icon className={`text-xl transition-transform duration-300 ${isOpen ? 'text-accent scale-110' : 'text-accent'}`} />}
          <span>{title}</span>
        </div>
        <FaChevronDown className={`text-textSecondary text-sm transition-all duration-400 ease-[cubic-bezier(0.68,-0.55,0.27,1.55)] ${isOpen ? 'rotate-180 text-accent' : ''}`} />
      </button>
      
      <div 
        className={`grid transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isOpen ? 'grid-rows-[1fr] opacity-100 visible border-t border-borderClient' : 'grid-rows-[0fr] opacity-0 invisible border-t-transparent'}`}
        aria-hidden={!isOpen}
      >
        <div className="overflow-hidden">
          <div className={`transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isOpen ? 'translate-y-0 p-4 md:p-8' : '-translate-y-2 p-0'}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
});

CollapsibleSection.displayName = 'CollapsibleSection';

interface StatsOverviewProps {
  stats: DashboardStats | null;
  weeklyActivity: WeeklyActivityData[];
  trackedDistricts: any[];
}

export default function StatsOverview({ stats, weeklyActivity, trackedDistricts }: StatsOverviewProps) {
  const { t } = useTranslation('db');
  const navigate = useNavigate();
  const { isRealtor } = useSubscription();

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {
        weekly_activity: true,
        investment_calculator: false,
        saved_districts: false,
        popular_districts: false,
        last_activity: false
      };
    } catch {
      return { investment_calculator: false };
    }
  });

  const toggleSection = useCallback((sectionId: string) => {
    setOpenSections(prev => {
      const newState = { ...prev, [sectionId]: !prev[sectionId] };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
  }, []);

  const handleNavigateToSearches = useCallback(() => navigate('/'), [navigate]);
  const handleNavigateToSaved = useCallback(() => navigate('/favorites'), [navigate]);
  
  const handleNavigateToCompare = useCallback(() => {
    if (isRealtor) {
      navigate('/profile/stats/compare');
    } else if (FEATURES_CONFIG.ENABLE_SUBSCRIPTIONS_PAGE) {
      navigate('/subscription');
    }
  }, [isRealtor, navigate]);

  return (
    <div className="max-w-[1200px] mx-auto w-full flex flex-col gap-6 md:gap-8 animate-fadeIn">
      <div className="w-full">
        <StatsCards 
          stats={stats} 
          onSearchesClick={handleNavigateToSearches}
          onSavedClick={handleNavigateToSaved}
          onCompareClick={handleNavigateToCompare}
          showCompare={isRealtor}
        />
      </div>

      <RequireSubscription allowedPlans={['realtor']} showLockFallback={true}>
        <CollapsibleSection 
          id="investment_calculator"
          title={t('stats.sections.investment_calculator')}
          icon={FaCalculator}
          isOpen={!!openSections['investment_calculator']}
          onToggle={toggleSection}
        >
          <InvestmentCalculator />
        </CollapsibleSection>
      </RequireSubscription>

      <RequireSubscription allowedPlans={['realtor']} showLockFallback={true}>
        <CollapsibleSection 
          id="saved_districts"
          title={t('stats.sections.saved_districts')} 
          icon={FaBookmark}
          isOpen={!!openSections['saved_districts']}
          onToggle={toggleSection}
        >
          <TrackedDistricts districts={trackedDistricts || []} />
        </CollapsibleSection>
      </RequireSubscription>

      <CollapsibleSection 
        id="weekly_activity"
        title={t('stats.sections.weekly_activity')} 
        icon={FaChartBar}
        isOpen={!!openSections['weekly_activity']}
        onToggle={toggleSection}
      >
        <WeeklyChart data={weeklyActivity || []} />
      </CollapsibleSection>

      <RequireSubscription allowedPlans={['realtor']} showLockFallback={true}>
        <CollapsibleSection 
          id="popular_districts"
          title={t('stats.sections.popular_districts')} 
          icon={FaMapMarkerAlt}
          isOpen={!!openSections['popular_districts']}
          onToggle={toggleSection}
        >
          <PopularDistricts /> 
        </CollapsibleSection>
      </RequireSubscription>

      <CollapsibleSection 
        id="last_activity"
        title={t('stats.sections.last_activity')} 
        icon={FaHistory}
        isOpen={!!openSections['last_activity']}
        onToggle={toggleSection}
      >
        <LastActivity 
          lastActive={stats?.lastActive} 
          favoriteDistrict={stats?.favoriteDistrict} 
        />
      </CollapsibleSection>
    </div>
  );
}