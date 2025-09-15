import { writable } from 'svelte/store';
import { keyOf, getCached, loadCoverFor } from '$lib/utils/covers.js';

export const coverCache = writable(new Map()); // key -> {url,loading,none,error}

function syncFromStorage(map) {
  // initiale sync aus utils-map via getCached pro key on demand
  return map;
}

export function ensureCover(album) {
  const key = keyOf(album);
  return loadCoverFor(album).then(state => {
    coverCache.update((m) => {
      const nm = new Map(m);
      nm.set(key, state);
      return nm;
    });
    return state;
  });
}

export function getState(album, currentMap) {
  const key = keyOf(album);
  return (currentMap && currentMap.get(key)) || getCached(key) || null;
}
