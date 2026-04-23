import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo, ReactNode } from "react";
import { favoritesApi } from "@api/favoritesApi";
import { supabase } from "@supabaseClient";
import { transformDistrictsForDisplay, TransformedDistrict } from "@utils/dataTransformers";
import { useFiltersConfig } from "@hooks/useFiltersConfig";
import { useSubscription } from "@subscription/SubscriptionContext";

export interface FavoritesContextType {
  favorites: TransformedDistrict[];
  loading: boolean;
  toggleFavorite: (district: Partial<TransformedDistrict> & { id: string | number }) => Promise<void>;
  isFavorite: (id: string | number) => boolean;
  refresh: () => void;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const [favorites, setFavorites] = useState<TransformedDistrict[]>([]);
  const [loading, setLoading] = useState(true);
  const isLoaded = useRef(false);

  // Отримуємо конфігурацію та стан підписки для правильної трансформації даних
  const { config } = useFiltersConfig();
  const { isFree, isRealtor } = useSubscription();

  const loadFavorites = useCallback(async () => {
    // Чекаємо, поки завантажиться конфігурація фільтрів, інакше трансформація поверне порожній масив
    if (isLoaded.current || !config) return;
    
    try {
      const data = await favoritesApi.getFavorites();
      // Передаємо всі 3 необхідні аргументи
      const transformed = transformDistrictsForDisplay(data || [], config, { isFree, isRealtor });
      setFavorites(transformed as TransformedDistrict[]);
      isLoaded.current = true;
    } catch {
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, [config, isFree, isRealtor]);

  useEffect(() => {
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setFavorites([]);
        isLoaded.current = false;
        setLoading(false);
      }
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
        loadFavorites();
      }
    });
    return () => authSubscription.unsubscribe();
  }, [loadFavorites]);

  // Додатковий ефект: якщо конфігурація завантажилася пізніше, оновлюємо дані
  useEffect(() => {
    if (config && !isLoaded.current) {
      loadFavorites();
    }
  }, [config, loadFavorites]);

  const toggleFavorite = useCallback(async (district: Partial<TransformedDistrict> & { id: string | number }) => {
    let wasFavorite = false;
    
    setFavorites((prev) => {
      wasFavorite = prev.some((f) => f.id === district.id);
      return wasFavorite
        ? prev.filter((f) => f.id !== district.id)
        : [...prev, { ...district, addedAt: new Date().toISOString() } as TransformedDistrict];
    });

    try {
      if (wasFavorite) {
        await favoritesApi.removeFavorite(district.id);
      } else {
        await favoritesApi.addFavorite(district.id);
      }
    } catch {
      setFavorites((prev) => {
        const isStillFav = prev.some((f) => f.id === district.id);
        if (wasFavorite && !isStillFav) {
          return [...prev, district as TransformedDistrict];
        }
        if (!wasFavorite && isStillFav) {
          return prev.filter((f) => f.id !== district.id);
        }
        return prev;
      });
    }
  }, []);

  const isFavorite = useCallback(
    (id: string | number) => favorites.some((f) => f.id === id || (f as any).district_id === id),
    [favorites]
  );

  const refresh = useCallback(() => {
    isLoaded.current = false;
    setLoading(true);
    loadFavorites();
  }, [loadFavorites]);

  const value = useMemo<FavoritesContextType>(() => ({
    favorites,
    loading,
    toggleFavorite,
    isFavorite,
    refresh,
  }), [favorites, loading, toggleFavorite, isFavorite, refresh]);

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = (): FavoritesContextType => {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used inside FavoritesProvider");
  return ctx;
};