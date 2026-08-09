import { z } from 'zod';
import type { FavoritesContextType } from '../types';

export const FavoritesContextSchema = z.custom<FavoritesContextType>(
  (val) => val !== null && typeof val === 'object',
  "useFavorites must be used inside FavoritesProvider"
);