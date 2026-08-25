import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { FaCompass, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useMapCities, MapCity } from '@admin/features/map/useMapCities';

const createCityIcon = (name: string, isActive: boolean) => {
  return L.divIcon({
    className: 'custom-city-marker',
    html: `
      <div class="relative flex items-center justify-center pointer-events-none transform -translate-x-1/2 -translate-y-1/2">
        ${isActive ? `
        <span class="absolute inline-flex h-12 w-12 rounded-full bg-[#c25e26]/15 animate-ping" style="animation-duration: 3s;"></span>
        <span class="absolute inline-flex h-8 w-8 rounded-full bg-[#c25e26]/30 animate-ping" style="animation-duration: 2s; animation-delay: 0.5s;"></span>
        ` : ''}
        <span class="relative flex h-3.5 w-3.5">
          ${isActive ? '<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c25e26] opacity-75"></span>' : ''}
          <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#c25e26] border-2 border-white shadow-md"></span>
        </span>
        <span class="absolute left-5 bg-[#2a2421]/90 dark:bg-black/80 backdrop-blur-sm text-[#faf7f2] text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-md shadow-md border border-[#e8e0d5]/30 whitespace-nowrap uppercase">
          ${name}
        </span>
      </div>
    `,
    iconSize: [0, 0]
  });
};

function AnimatedFlyController({
  targetCityIndex,
  onCityChange,
  cities
}: {
  targetCityIndex: number;
  onCityChange: (index: number) => void;
  cities: MapCity[];
}) {
  const map = useMap();
  
  useEffect(() => {
    const target = cities[targetCityIndex];
    if (target) {
      map.flyTo(target.coords, target.zoom || 14, {
        duration: 4,
        easeLinearity: 0.2
      });
    }
  }, [targetCityIndex, map, cities]);

  useEffect(() => {
    if (cities.length === 0) return;
    
    let isMounted = true; // Додано прапорець
    
    const interval = setInterval(() => {
      // Оновлюємо стейт, лише якщо компонент досі існує
      if (isMounted) {
        onCityChange((targetCityIndex + 1) % cities.length);
      }
    }, 20000);
    
    return () => {
      isMounted = false; // Змінюємо прапорець при розмонтуванні
      clearInterval(interval);
    };
  }, [targetCityIndex, onCityChange, cities]);

  return null;
}
export default function BackgroundMap() {
  const { cities, loading } = useMapCities();
  const [cityIndex, setCityIndex] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  const handlePrevCity = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (cities.length === 0) return;
    setCityIndex((prev) => (prev - 1 + cities.length) % cities.length);
  };

  const handleNextCity = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (cities.length === 0) return;
    setCityIndex((prev) => (prev + 1) % cities.length);
  };

  const tileUrl = isDarkMode
    ? "https://{s}.basemaps.cartocdn.com/rastertiles/dark_nolabels/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png";

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-auto z-0">
      <div className="w-full h-full opacity-90 transition-opacity duration-500">
        {!loading && cities.length > 0 && (
          <MapContainer
            center={cities[0].coords}
            zoom={cities[0].zoom || 14}
            scrollWheelZoom={false}
            dragging={false}
            zoomControl={false}
            attributionControl={false}
            doubleClickZoom={false}
            className="w-full h-full"
          >
            <TileLayer url={tileUrl} maxZoom={19} />
            {cities.map((city, index) => (
              <Marker
                key={city.name}
                position={city.coords}
                icon={createCityIcon(city.name, index === cityIndex)}
              />
            ))}
            <AnimatedFlyController
              targetCityIndex={cityIndex}
              onCityChange={setCityIndex}
              cities={cities}
            />
          </MapContainer>
        )}
      </div>

      <div className="absolute top-4 right-4 z-20 pointer-events-auto">
        <div className="flex items-center gap-2 bg-[#faf7f2]/90 dark:bg-[#1a1614]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#e8e0d5] dark:border-[#38312c] shadow-lg">
          <FaCompass className="text-[#c25e26] text-xs animate-spin" style={{ animationDuration: '8s' }} />
          <div className="flex flex-col min-w-[70px]">
            <span className="text-[9px] uppercase font-bold text-[#8c827a] tracking-wider leading-none">Exploring</span>
            <span className="text-xs font-serif font-bold text-[#2a2421] dark:text-[#f4efe6] leading-tight">
              {cities.length > 0 ? cities[cityIndex]?.name : '...'}
            </span>
          </div>
          <div className="flex items-center gap-1 border-l border-[#e8e0d5] dark:border-[#38312c] pl-2 ml-1">
            <button
              type="button"
              onClick={handlePrevCity}
              className="p-1 rounded text-[#8c827a] hover:text-[#c25e26] hover:bg-[#ebdcd0] dark:hover:bg-[#2b2520] transition-colors cursor-pointer"
            >
              <FaChevronLeft className="text-[9px]" />
            </button>
            <button
              type="button"
              onClick={handleNextCity}
              className="p-1 rounded text-[#8c827a] hover:text-[#c25e26] hover:bg-[#ebdcd0] dark:hover:bg-[#2b2520] transition-colors cursor-pointer"
            >
              <FaChevronRight className="text-[9px]" />
            </button>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#faf7f2]/10 dark:via-black/10 to-[#2a2421]/15 dark:to-black/30 pointer-events-none" />
    </div>
  );
}