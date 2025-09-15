// iTunes zuerst, dann MusicBrainz + Cover Art Archive (CAA)
// Cache: localStorage ("coverCache:v1") + In-Memory Map

const CACHE_NS = 'coverCache:v1';
const mem = new Map();

// load persisted cache
(function init() {
  try {
    const raw = localStorage.getItem(CACHE_NS);
    if (raw) {
      const obj = JSON.parse(raw);
      Object.entries(obj).forEach(([k, v]) => mem.set(k, v));
    }
  } catch {}
})();

function persist() {
  // nur kleine Map → als flaches Objekt speichern
  const obj = {};
  mem.forEach((v, k) => (obj[k] = v));
  try { localStorage.setItem(CACHE_NS, JSON.stringify(obj)); } catch {}
}

export function keyOf(album) {
  const artist = (album.album?.artist || '').trim().toLowerCase();
  const title  = (album.album?.title || '').trim().toLowerCase();
  return `${artist}||${title}`;
}
export function getCached(key) { return mem.get(key) || null; }

export async function loadCoverFor(album) {
  const key = keyOf(album);
  const hit = mem.get(key);
  if (hit && (hit.url || hit.none)) return hit;

  setState(key, { loading: true });

  // 1) iTunes
  try {
    const it = await searchITunes(album);
    if (it) {
      const url = it.replace('100x100bb.jpg', '600x600bb.jpg');
      setState(key, { url, loading: false });
      return mem.get(key);
    }
  } catch {}

  // 2) MusicBrainz + CAA
  try {
    const mbid = await findMusicBrainzRelease(album);
    if (mbid) {
      const url = `https://coverartarchive.org/release/${mbid}/front-500`;
      setState(key, { url, loading: false });
      return mem.get(key);
    }
  } catch {}

  setState(key, { none: true, loading: false, error: true });
  return mem.get(key);
}

function setState(key, partial) {
  const prev = mem.get(key) || {};
  const next = { ...prev, ...partial };
  mem.set(key, next);
  persist();
}

export function markBrokenFor(album) {
  const key = keyOf(album);
  setState(key, { url: null, none: true, error: true, loading: false });
}

async function searchITunes(album) {
  const term = encodeURIComponent(`${album.album?.artist} ${album.album?.title}`);
  const url = `https://itunes.apple.com/search?media=music&entity=album&limit=5&term=${term}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('itunes fail');
  const data = await res.json();
  if (!data?.results?.length) return null;
  // einfacher Match: best score = includes both artist & title
  const lower = (s) => String(s||'').toLowerCase();
  const a = lower(album.album.artist), t = lower(album.album.title);
  const best = data.results.find(r => lower(r.artistName).includes(a) && lower(r.collectionName).includes(t))
            || data.results[0];
  return best?.artworkUrl100 || null;
}

async function findMusicBrainzRelease(album) {
  const query = encodeURIComponent(`artist:"${album.album?.artist}" AND release:"${album.album?.title}"`);
  const url = `https://musicbrainz.org/ws/2/release/?query=${query}&fmt=json&limit=5`;
  const res = await fetch(url, { headers: { 'Accept': 'application/json' }});
  if (!res.ok) throw new Error('mb fail');
  const data = await res.json();
  if (!data?.releases?.length) return null;
  // nimm ein Release mit Cover-Art Hinweis falls vorhanden, sonst erstes
  const withCover = data.releases.find(r => r['cover-art-archive']?.front);
  return (withCover || data.releases[0])?.id || null;
}
