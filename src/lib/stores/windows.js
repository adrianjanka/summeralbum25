// src/lib/stores/windows.js
import { writable, derived } from 'svelte/store';
import albumsData from '../data/albums.json';

export const sortBy = writable({ key: 'date', dir: 'asc' }); // key: date|album|year|artist|genre|length|label|rating

export const albums = writable(albumsData);

function parseLength(s) {
  if (!s) return 0;
  const m = String(s).match(/(\d+)\s*[:m]\s*(\d{1,2})/i);
  if (m) return parseInt(m[1],10)*60 + parseInt(m[2],10);
  // Fallback: 44m 12s
  const m2 = String(s).match(/(\d+)\s*m(?:in)?\s*(\d+)?/i);
  if (m2) return parseInt(m2[1],10)*60 + (m2[2]?parseInt(m2[2],10):0);
  return 0;
}

function getField(a, key) {
  switch (key) {
    case 'date':   return a.date || '';
    case 'album':  return a.album?.title || '';
    case 'year':   return a.album?.year ?? 0;
    case 'artist': return a.album?.artist || '';
    case 'genre':  return (a.album?.genres && a.album.genres[0]) || '';
    case 'label':  return (a.labels && a.labels[0]) || '';
    case 'length': return parseLength(a.album?.length);
    case 'rating': return a.rating ?? -1;
    default:       return '';
  }
}

export const sortedAlbums = derived([albums, sortBy], ([$a, $s]) => {
  const { key, dir } = $s;
  const copy = [...$a];
  copy.sort((x,y)=>{
    const ax = getField(x, key);
    const ay = getField(y, key);
    let cmp = 0;
    if (typeof ax === 'number' && typeof ay === 'number') cmp = ax - ay;
    else cmp = String(ax).localeCompare(String(ay), 'de', { sensitivity:'base' });
    if (cmp === 0) cmp = String(x.date).localeCompare(String(y.date)); // stabil
    return dir === 'desc' ? -cmp : cmp;
  });
  return copy;
});

let zTop = 10;
function createWindowStore(){
  const { subscribe, update, set } = writable([]);
  return {
    subscribe,
    reset: ()=> set([]),
    openFor: (a)=> update(ws=>{
      const id = a.date, title = `${a.album.title} – ${a.album.artist}`;
      const ex = ws.find(w=> w.id===id);
      if (ex) return ws.map(w=> w.id===id ? {...w, active:true, rect:{...w.rect, z: ++zTop}} : {...w, active:false});
      const nx = { id, date:a.date, title, album: a, rect:{ x:60+(ws.length*24)%240, y:90+(ws.length*18)%180, w:560, h:380, z: ++zTop }, active:true };
      return ws.map(w=> ({...w, active:false})).concat(nx);
    }),
    focus: (id)=> update(ws=> ws.map(w=> w.id===id ? ({...w, active:true, rect:{...w.rect, z: ++zTop}}) : ({...w, active:false}))),
    close:  (id)=> update(ws=> ws.filter(w=> w.id!==id)),
    move:   (id, x, y)=> update(ws=> ws.map(w=> w.id===id ? ({...w, rect:{...w.rect, x, y}}) : w)),
    resize: (id, w, h)=> update(ws=> ws.map(w=> w.id===id ? ({...w, rect:{...w.rect, w, h}}) : w))
  };
}
export const windows = createWindowStore();
