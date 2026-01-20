import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaChevronDown, FaChartBar, FaMapMarkerAlt, FaHistory, FaBookmark } from 'react-icons/fa';
import styles from './StatsPage.module.css';
import StatsCards from './components/StatsCards/StatsCards';
import WeeklyChart from './components/WeeklyChart/WeeklyChart';
import PopularDistricts from './components/PopularDistricts/PopularDistricts';
import TrackedDistricts from './components/TrackedDistricts/TrackedDistricts';
import LastActivity from './components/LastActivity/LastActivity';

const STORAGE_KEY = 'stats_page_sections_state';

const CollapsibleSection = ({ id, title, icon: Icon, children, isOpen, onToggle }) => {
  return (
    <div className={`${styles.sectionWrapper} ${isOpen ? styles.open : ''}`}>
      <button 
        className={styles.sectionHeader} 
        onClick={() => onToggle(id)}
        aria-expanded={isOpen}
      >
        <div className={styles.headerTitle}>
          {Icon && <Icon className={styles.headerIcon} />}
          <span>{title}</span>
        </div>
        <FaChevronDown className={`${styles.chevron} ${isOpen ? styles.rotate : ''}`} />
      </button>
      
      <div className={`${styles.sectionContent} ${isOpen ? styles.contentVisible : ''}`}>
        {isOpen && children}
      </div>
    </div>
  );
};

export default function StatsOverview({ stats, weeklyActivity, trackedDistricts }) {
  const { t } = useTranslation('stats');
  const navigate = useNavigate();

  const [openSections, setOpenSections] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleSection = (sectionId) => {
    setOpenSections(prev => {
      const newState = { ...prev, [sectionId]: !prev[sectionId] };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
  };

  const handleNavigateToSearches = () => {
    navigate('/');
  };

  const handleNavigateToSaved = () => {
    navigate('/favorites');
  };

  const handleNavigateToCompare = () => {
    navigate('/profile/stats/compare');
  };

  return (
    <div className={styles.content}>
      <div className={styles.cardsSection}>
        <StatsCards 
          stats={stats} 
          onSearchesClick={handleNavigateToSearches}
          onSavedClick={handleNavigateToSaved}
          onCompareClick={handleNavigateToCompare} 
        />
      </div>

      <CollapsibleSection 
        id="saved_districts"
        title={t('stats_page.saved_districts')} 
        icon={FaBookmark}
        isOpen={!!openSections['saved_districts']}
        onToggle={toggleSection}
      >
         <TrackedDistricts districts={trackedDistricts || []} />
      </CollapsibleSection>

      <CollapsibleSection 
        id="weekly_activity"
        title={t('stats_page.weekly_activity')} 
        icon={FaChartBar}
        isOpen={!!openSections['weekly_activity']}
        onToggle={toggleSection}
      >
         <WeeklyChart data={weeklyActivity || []} />
      </CollapsibleSection>

      <CollapsibleSection 
        id="popular_districts"
        title={t('stats_page.popular_districts')} 
        icon={FaMapMarkerAlt}
        isOpen={!!openSections['popular_districts']}
        onToggle={toggleSection}
      >
         <PopularDistricts /> 
      </CollapsibleSection>

      <CollapsibleSection 
        id="last_activity"
        title={t('stats_page.last_activity')} 
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