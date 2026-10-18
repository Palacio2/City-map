import { ReactNode } from 'react';
import { FaLandmark, FaLaptopCode, FaPalette, FaWater, FaCity, FaArrowRight, FaMapMarkerAlt } from 'react-icons/fa';
import type { LocationCardProps } from '../types';

const getIcon = (type?: string): ReactNode => {
  switch (type) {
    case 'capital':
      return <FaLandmark className="text-base text-amber-500" />;
    case 'tech':
      return <FaLaptopCode className="text-base text-blue-500" />;
    case 'culture':
      return <FaPalette className="text-base text-purple-500" />;
    case 'sea':
      return <FaWater className="text-base text-cyan-500" />;
    case 'hub':
    default:
      return <FaCity className="text-base text-primary" />;
  }
};

export const LocationCard = ({ item, onClick }: LocationCardProps) => {
  const displayTag = item.fallbackTag || (item.districtsCount ? `${item.districtsCount} районів` : null);

  return (
    <button
      type="button"
      onClick={() => onClick(item.country, item.city)}
      className="group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-surface border border-borderClient hover:border-primary/50 shadow-xs hover:shadow-lg transition-all duration-300 text-left cursor-pointer hover:-translate-y-1 overflow-hidden"
    >
      {/* Subtle hover gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      <div className="relative z-10 flex items-start justify-between gap-2 mb-3">
        <div className="w-10 h-10 rounded-xl bg-body border border-borderClient flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          {getIcon(item.iconType)}
        </div>

        {displayTag && (
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-primary-subtle text-primary shrink-0 flex items-center gap-1">
            {item.districtsCount ? <FaMapMarkerAlt className="text-[9px]" /> : null}
            {displayTag}
          </span>
        )}
      </div>

      <div className="relative z-10">
        <h3 className="text-base sm:text-lg font-bold text-textMain group-hover:text-primary transition-colors leading-tight mb-1">
          {item.city}
        </h3>
        <div className="flex items-center justify-between text-xs text-textSecondary font-medium">
          <span>{item.country}</span>
          <span className="inline-flex items-center gap-1 font-semibold text-primary opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-200">
            Відкрити <FaArrowRight className="text-[10px]" />
          </span>
        </div>
      </div>
    </button>
  );
};
