import React, { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { favoritesApi } from '../api/favoritesApi';
import { transformDistrictsForDisplay } from "@utils/dataTransformers";
import { useFiltersConfig } from "@hooks/useFiltersConfig";
import { useSubscription } from "@subscription/contex/SubscriptionContext";
import { useAuth } from "@auth/context/AuthContext";
import type { TransformedDistrict } from "@utils/dataTransformers";
import type { FavoritesContextType } from "../types";
import { FavoritesContextSchema } from "../validation";

const FavoritesContext = createContext<FavoritesContextType | null>(null);

interface FavoritesProviderProps {
  readonly children: ReactNode;
}

export const FavoritesProvider: React.FC<FavoritesProviderProps> = ({ children }) => {
  const { config } = useFiltersConfig();
  const { isFree, isRealtor } = useSubscription();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ["favorites", isFree, isRealtor],
    queryFn: async (): Promise<TransformedDistrict[]> => {
      if (!config) return [];
      const data = await favoritesApi.getFavorites();
      return transformDistrictsForDisplay(data || [], config, { isFree, isRealtor });
    },
    enabled: isAuthenticated && !!config,
    staleTime: 5 * 60 * 1000,
  });

  const toggleMutation = useMutation({
    mutationFn: async (district: Partial<TransformedDistrict> & { id: string | number }) => {
      const isFav = favorites.some((f) => f.id === district.id);
      if (isFav) {
        await favoritesApi.removeFavorite(district.id);
      } else {
        await favoritesApi.addFavorite(district.id);
      }
    },
    onMutate: async (district) => {
      await queryClient.cancelQueries({ queryKey: ["favorites"] });
      const previousFavorites = queryClient.getQueryData<TransformedDistrict[]>(["favorites"]);
      const isFav = previousFavorites?.some((f) => f.id === district.id);
      
      queryClient.setQueryData<TransformedDistrict[]>(["favorites"], (old = []) => {
        if (isFav) return old.filter((f) => f.id !== district.id);
        return [...old, { ...district, addedAt: new Date().toISOString() } as TransformedDistrict];
      });
      return { previousFavorites };
    },
    onError: (_err, _newDistrict, context) => {
      if (context?.previousFavorites) {
        queryClient.setQueryData(["favorites"], context.previousFavorites);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });

  const toggleFavorite = async (district: Partial<TransformedDistrict> & { id: string | number }) => {
    await toggleMutation.mutateAsync(district);
  };

  const isFavorite = (id: string | number) => {
    return favorites.some((f) => f.id === id || (f as Record<string, unknown>).district_id === id);
  };

  const value = useMemo<FavoritesContextType>(() => ({
    favorites,
    isLoading,
    toggleFavorite,
    isFavorite,
  }), [favorites, isLoading]);

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = (): FavoritesContextType => {
  const ctx = useContext(FavoritesContext);
  return FavoritesContextSchema.parse(ctx);
};