'use client';

import { useState, useCallback } from 'react';

const STORAGE_KEY = 'whereami_favorites';

function readFromStorage(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? new Set(JSON.parse(stored) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

export function useFavoriteStations() {
  const [favorites, setFavorites] = useState<Set<string>>(readFromStorage);

  const toggle = useCallback((stationId: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(stationId)) next.delete(stationId);
      else next.add(stationId);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      } catch { /* 스토리지 용량 초과 무시 */ }
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (stationId: string) => favorites.has(stationId),
    [favorites],
  );

  return { isFavorite, toggle, count: favorites.size };
}
