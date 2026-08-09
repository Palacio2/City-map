import { useTranslation } from 'react-i18next';
import { FiX, FiCheck } from 'react-icons/fi';
import type { GeoMapSidebarProps } from '../types/geo';

export const GeoMapSidebar = ({
  availableTypes,
  activeFilters,
  geoData,
  isMobileFilterOpen,
  setIsMobileFilterOpen,
  toggleAll,
  toggleFilter,
  getEmojiForType,
}: GeoMapSidebarProps) => {
  const { t } = useTranslation('db');

  if (availableTypes.length === 0) return null;
  const allSelected = activeFilters.length === availableTypes.length;

  return (
    <div className={`absolute top-0 left-0 w-full h-full md:relative md:w-[320px] bg-surface border-r border-borderClient flex flex-col shrink-0 z-[var(--z-modal)] md:z-[var(--z-sidebar)] transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isMobileFilterOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
      <div className="p-5 border-b border-borderClient flex justify-between items-center bg-surface">
        <h4 className="m-0 font-heading text-textMain text-[1.1rem] font-bold">
          {t('district.map.filters_title')}
        </h4>
        <button 
          type="button"
          className="md:hidden bg-transparent border-none text-textSecondary cursor-pointer" 
          onClick={() => setIsMobileFilterOpen(false)} 
          aria-label={t('district.actions.close')}
        >
          <FiX size={24} />
        </button>
      </div>
      
      <div className="py-4 px-5 flex justify-between items-center bg-body border-b border-borderClient">
        <button 
          type="button"
          onClick={toggleAll} 
          className="bg-transparent border-none text-accent font-body font-semibold text-[0.9rem] cursor-pointer p-0 transition-opacity hover:opacity-80"
        >
          {allSelected ? t('district.actions.clear_all') : t('district.actions.select_all')}
        </button>
        <span className="text-[0.85rem] text-textSecondary font-bold bg-borderClient/30 px-2 py-0.5 rounded-full">
          {activeFilters.length} / {availableTypes.length}
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 custom-scrollbar">
        {availableTypes.map(type => {
          const isActive = activeFilters.includes(type);
          const count = (geoData?.poi_data || []).filter(p => p.type === type).length;
          const withCount = type.endsWith('_count') ? type : `${type}_count`;
          const withoutCount = type.replace('_count', '');
          
          const translatedName = t([
            `common.fields.${withCount}`,
            withCount,
            `common.fields.${withoutCount}`,
            withoutCount
          ], {
            defaultValue: withoutCount
          });

          return (
            <button
              key={type}
              type="button"
              className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors border w-full text-left outline-none hover:bg-hover ${isActive ? 'bg-hover border-borderClient shadow-sm' : 'bg-transparent border-transparent'}`}
              onClick={() => toggleFilter(type)}
            >
              <div className={`w-5 h-5 rounded-md border-2 mr-3 flex items-center justify-center transition-colors ${isActive ? 'bg-accent border-accent text-white' : 'bg-transparent border-borderClient'}`}>
                {isActive && <FiCheck size={14} />}
              </div>
              <span className="text-xl mr-3 leading-none" aria-hidden="true">{getEmojiForType(type)}</span>
              <span className="font-body text-[0.95rem] text-textMain font-medium capitalize flex-1">{translatedName}</span>
              <span className="text-[0.85rem] text-textSecondary font-bold bg-borderClient/30 px-2 py-0.5 rounded-full">{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};