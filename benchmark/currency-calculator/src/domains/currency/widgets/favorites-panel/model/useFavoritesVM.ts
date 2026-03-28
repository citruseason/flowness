import { useState, useMemo, useCallback } from 'react';
import {
  getFavorites,
  addFavorite,
  removeFavorite,
  isFavorite,
} from '../../../features/favorites/model/favorites';
import type { FavoritePair } from '../../../entities/currency/model/types';

export interface FavoritesVMState {
  favorites: FavoritePair[];
  currentIsFavorite: boolean;
  handleToggleFavorite: () => void;
  handleSelectPair: (source: string, target: string) => void;
  handleRemove: (source: string, target: string) => void;
}

export function useFavoritesVM(
  sourceCurrency: string,
  targetCurrency: string,
  onSelectPair: (source: string, target: string) => void,
): FavoritesVMState {
  const [refreshKey, setRefreshKey] = useState(0);

  const favorites = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    refreshKey; // dependency to force re-read
    return getFavorites();
  }, [refreshKey]);

  const currentIsFavorite = useMemo(
    () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      refreshKey;
      return isFavorite(sourceCurrency, targetCurrency);
    },
    [sourceCurrency, targetCurrency, refreshKey],
  );

  const handleToggleFavorite = useCallback(() => {
    if (currentIsFavorite) {
      removeFavorite(sourceCurrency, targetCurrency);
    } else {
      addFavorite(sourceCurrency, targetCurrency);
    }
    setRefreshKey((k) => k + 1);
  }, [currentIsFavorite, sourceCurrency, targetCurrency]);

  const handleSelectPair = useCallback(
    (source: string, target: string) => {
      onSelectPair(source, target);
    },
    [onSelectPair],
  );

  const handleRemove = useCallback(
    (source: string, target: string) => {
      removeFavorite(source, target);
      setRefreshKey((k) => k + 1);
    },
    [],
  );

  return {
    favorites,
    currentIsFavorite,
    handleToggleFavorite,
    handleSelectPair,
    handleRemove,
  };
}
