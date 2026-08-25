import { useState, useEffect } from 'react';
import { supabase } from '@supabaseClient';

export interface MapCity {
  name: string;
  coords: [number, number];
  zoom?: number;
}

export function useMapCities() {
  const [cities, setCities] = useState<MapCity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchCities() {
      try {
        const { data: dbCities, error } = await supabase
          .from('cities')
          .select('name')
          .eq('is_available', true);

        if (error) throw error;

        if (dbCities && dbCities.length > 0) {
          const finalCities: MapCity[] = [];
          const cachedCoordsStr = localStorage.getItem('city_coords_cache');
          const cachedCoords = cachedCoordsStr ? JSON.parse(cachedCoordsStr) : {};
          let cacheUpdated = false;

          for (const city of dbCities) {
            // 1. Check localStorage cache
            if (cachedCoords[city.name]) {
              finalCities.push({ name: city.name, coords: cachedCoords[city.name], zoom: 14 });
              continue;
            }

            // 3. Fetch from Nominatim (with delay to avoid rate limiting)
            try {
              const res = await fetch(`https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(city.name)}&format=json&limit=1`);
              const data = await res.json();
              if (data && data.length > 0) {
                const coords: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
                cachedCoords[city.name] = coords;
                cacheUpdated = true;
                finalCities.push({ name: city.name, coords, zoom: 14 });
              }
              // Be nice to Nominatim
              await new Promise(r => setTimeout(r, 1000));
            } catch {
              // Ignore geocoding errors, just skip the city
            }
          }

          if (cacheUpdated) {
            localStorage.setItem('city_coords_cache', JSON.stringify(cachedCoords));
          }

          if (isMounted && finalCities.length > 0) {
            setCities(finalCities);
          }
        }
      } catch {
        // Fallback to constants on error
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchCities();

    return () => {
      isMounted = false;
    };
  }, []);

  return { cities, loading };
}
