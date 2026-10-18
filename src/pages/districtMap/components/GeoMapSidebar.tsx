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
    <>
      {/* Mobile Backdrop */}
      {isMobileFilterOpen && (
        <div 
          className="md:hidden absolute inset-0 bg-black/50 backdrop-blur-[2px] z-[40] animate-fadeIn"
          onClick={() => setIsMobileFilterOpen(false)}
        />
      )}

      <div 
        className={`
          absolute md:relative
          bottom-0 left-0
          w-full md:w-[320px]
          h-[85%] md:h-full
          bg-surface
          rounded-t-[2rem] md:rounded-none
          border-t md:border-t-0 md:border-r border-borderClient
          flex flex-col shrink-0
          z-[50] md:z-[var(--z-sidebar)]
          transition-transform duration-400 ease-[cubic-bezier(0.32,0.72,0,1)]
          ${isMobileFilterOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
        `}
      >
        {/* Mobile Drag Handle */}
        <div className="md:hidden w-12 h-1.5 bg-borderClient rounded-full mx-auto mt-4 mb-1 shrink-0" />

        <div className="p-4 md:p-5 border-b border-borderClient flex justify-between items-center bg-surface shrink-0">
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
              className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors border w-full text-left outline-hidden hover:bg-hover ${isActive ? 'bg-hover border-borderClient shadow-xs' : 'bg-transparent border-transparent'}`}
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
    </>
  );
};