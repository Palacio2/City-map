import { useTranslation } from 'react-i18next';
import { FaHistory, FaTimes, FaMapMarkerAlt } from 'react-icons/fa';
import type { RecentLocationsProps } from '../types';

export const RecentLocations = ({
  locations,
  onSelect,
  onRemove,
  onClearAll,
}: RecentLocationsProps) => {
  const { t } = useTranslation('db');

  if (!locations || locations.length === 0) return null;

  return (
    <div className="w-full max-w-xl mx-auto mb-6 animate-fadeIn px-5 sm:px-0">
      <div className="flex items-center justify-between mb-2.5 px-1">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-textSecondary">
          <FaHistory className="text-[11px] text-primary" />
          <span>{t('country.recent_title')}</span>
        </div>
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs text-textSecondary hover:text-danger transition-colors font-medium cursor-pointer"
        >
          {t('country.clear_recent')}
        </button>
      </div>

      <div className="flex overflow-x-auto sm:flex-wrap gap-2 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 scrollable-x">
        {locations.map((loc) => (
          <div
            key={loc.id}
            className="group shrink-0 inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-xl bg-surface border border-borderClient hover:border-primary/50 shadow-xs transition-all text-xs font-medium text-textMain"
          >
            <button
              type="button"
              onClick={() => onSelect(loc.country, loc.city)}
              className="inline-flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer"
            >
              <FaMapMarkerAlt className="text-[10px] text-primary" />
              <span>
                <strong className="font-semibold">{loc.city}</strong>, {loc.country}
              </span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(loc.id);
              }}
              className="w-5 h-5 flex items-center justify-center rounded-full text-textSecondary hover:text-danger hover:bg-danger/10 transition-colors ml-1 cursor-pointer"
              title={t('common.delete')}
            >
              <FaTimes className="text-[10px]" />
            </button>
          </div>
        ))}
      </div>
      <style>{`
        .scrollable-x::-webkit-scrollbar {
          display: none;
        }
        .scrollable-x {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};
