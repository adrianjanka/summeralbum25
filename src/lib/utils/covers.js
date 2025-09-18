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

export async function loadCoverFor(album, retries = 2) {
  const key = keyOf(album);
  const current = mem.get(key);

  // schon am Laden? -> bestehendes Promise zurückgeben
  if (current?.loading && current.promise) return current.promise;

  // Ladezustand setzen
  const loading = { ...(current || {}), loading: true };
  mem.set(key, loading);

  const promise = (async () => {
    try {
      const url = await fetchCoverFromAPI(album);
      if (!url) throw new Error('no cover');

      const next = { url, loading: false, error: false };
      mem.set(key, next);
      persist();
      return next;
    } catch (e) {
      if (retries > 0) {
        await new Promise(r => setTimeout(r, 600));
        return loadCoverFor(album, retries - 1);
      }
      const fail = { url: null, loading: false, error: true };
      mem.set(key, fail);
      persist();
      return fail;
    }
  })();

  // Promise im State merken (damit parallele Aufrufe warten)
  mem.set(key, { ...loading, promise });
  return promise;
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


// 1) Versuche iTunes, 2) sonst MusicBrainz + Cover Art Archive
async function fetchCoverFromAPI(album) {
  // iTunes zuerst
  const itunes = await searchITunes(album).catch(() => null);
  if (itunes) {
    // 100x100 → 600x600 (iTunes Trick)
    return itunes.replace(/100x100bb\.jpg$/, '600x600bb.jpg');
  }

  // MusicBrainz Fallback
  const mbid = await findMusicBrainzRelease(album).catch(() => null);
  if (!mbid) return null;

  // Cover Art Archive: nimm kleines Front-Cover (250/500 je nach Geschmack)
  const caa250 = `https://coverartarchive.org/release/${mbid}/front-500`;
  const ok = await headOk(caa250);
  return ok ? caa250 : null;
}

// kleiner HEAD-Check (CAA liefert 404, wenn nicht vorhanden)
async function headOk(url) {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok;
  } catch {
    return false;
  }
}


// Sanftes Vorladen aller noch fehlenden Cover (sequentiell, idle)
export function prefetchCoversSequential(albums, max = 999) {
  const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 400));
  let i = 0, done = 0;

  const step = () => {
    if (done >= max || i >= albums.length) return;
    const a = albums[i++];
    const k = keyOf(a);
    const st = mem.get(k);

    // nur laden, wenn noch keine URL existiert und gerade nichts lädt
    if (!st || (!st.url && !st.loading)) {
      loadCoverFor(a).finally(() => { done++; idle(step); });
    } else {
      idle(step);
    }
  };

  idle(step);
}