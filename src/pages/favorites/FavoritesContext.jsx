import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { favoritesApi } from '@api/favoritesApi';
import { supabase } from '@supabaseClient';
import { transformDistrictsForDisplay } from '@utils/dataTransformers';

const FavoritesContext = createContext();

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const isLoaded = useRef(false);
  const isFetching = useRef(false);

  const loadFavorites = useCallback(async () => {
    if (isLoaded.current || isFetching.current) return;

    isFetching.current = true;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      const data = await favoritesApi.getFavorites();
      const transformed = transformDistrictsForDisplay(data || []);
      
      setFavorites(transformed);
      isLoaded.current = true;
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      
      if (event === 'SIGNED_OUT') {
        setFavorites([]);
        isLoaded.current = false;
        setLoading(false);
      } else if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        loadFavorites();
      }
    });

    return () => { 
      mounted = false; 
      subscription.unsubscribe(); 
    };
  }, [loadFavorites]);

  const isFavorite = useCallback((districtId) => {
    return favorites.some(f => f.id === districtId || f.district_id === districtId);
  }, [favorites]);

  const addFavorite = useCallback(async (district) => {
    const newFav = { ...district, addedAt: new Date().toISOString() };
    setFavorites(prev => [...prev, newFav]);
    
    try {
      await favoritesApi.addFavorite(district.id);
    } catch (e) {
      setFavorites(prev => prev.filter(f => f.id !== district.id));
      throw e;
    }
  }, []);

  const removeFavorite = useCallback(async (districtId) => {
    const prevFavorites = [...favorites];
    
    setFavorites(prev => prev.filter(f => f.id !== districtId));

    try {
      await favoritesApi.removeFavorite(districtId);
    } catch (e) {
      console.error("Remove failed:", e);
      setFavorites(prevFavorites);
      throw e;
    }
  }, [favorites]);

  const toggleFavorite = useCallback(async (district) => {
    if (isFavorite(district.id)) {
      await removeFavorite(district.id);
    } else {
      await addFavorite(district);
    }
  }, [isFavorite, addFavorite, removeFavorite]);

  return (
    <FavoritesContext.Provider value={{ 
      favorites, 
      loading, 
      isFavorite, 
      toggleFavorite, 
      removeFavorite,
      addFavorite,
      refresh: () => { isLoaded.current = false; loadFavorites(); }
    }}>
      {children}
    </FavoritesContext.Provider>
  );
};