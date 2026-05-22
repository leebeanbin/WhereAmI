'use client';

import { useState, useCallback, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const STORAGE_KEY = 'whereami_favorites';
const FAVORITES_DOC_REF = () => doc(db, 'users', 'anonymous', 'favorites', 'stations');

function readFromStorage(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? new Set(JSON.parse(stored) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function writeToStorage(ids: string[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(ids)); } catch { /* 무시 */ }
}

async function loadFromFirestore(): Promise<Set<string> | null> {
  try {
    const snap = await getDoc(FAVORITES_DOC_REF());
    return snap.exists() ? new Set(snap.data().stationIds as string[]) : new Set();
  } catch {
    return null;
  }
}

async function saveToFirestore(ids: string[]): Promise<void> {
  try {
    await setDoc(FAVORITES_DOC_REF(), { stationIds: ids });
  } catch { /* Firebase 미설정 시 무시 */ }
}

export function useFavoriteStations() {
  const [favorites, setFavorites] = useState<Set<string>>(readFromStorage);

  // 마운트 시 Firestore에서 동기화 (Firestore를 단일 소스로 사용)
  useEffect(() => {
    loadFromFirestore().then(remote => {
      if (remote === null) return; // Firebase 미설정 → localStorage 유지
      setFavorites(remote);
      writeToStorage([...remote]);
    });
  }, []);

  const toggle = useCallback((stationId: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(stationId)) next.delete(stationId);
      else next.add(stationId);
      const ids = [...next];
      writeToStorage(ids);
      saveToFirestore(ids);
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (stationId: string) => favorites.has(stationId),
    [favorites],
  );

  return { isFavorite, toggle, count: favorites.size };
}
