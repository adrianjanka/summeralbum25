<script>
  import { onMount } from 'svelte';
  import interact from 'interactjs';
  import { markBrokenFor } from '$lib/utils/covers.js';
  import { coverCache, ensureCover, getState } from '$lib/stores/covers.js';
  import { windows } from '$lib/stores/windows.js';

  export let album;
  export let id;
  export let x = 100, y = 100, z = 10, active = true;

  export let w = 720;
  export let h = 460;

  let cacheMap = new Map();
  const unsub = coverCache.subscribe(v => (cacheMap = v));

  // Cover anstoßen, sobald das Fenster gezeichnet/Album gebunden ist
  $: album && ensureCover(album);

  onMount(() => {
    const el = document.getElementById(id);
    if (!el) return;

    interact(el)
      .draggable({
        allowFrom: '.win-titlebar',
        listeners: {
          move(e) {
            x += e.dx;
            y += e.dy;
            el.style.left = x + 'px';
            el.style.top = y + 'px';
          }
        }
      })
      .resizable({ edges: { left: true, right: true, bottom: true, top: false } })
      .on('resizemove', (e) => {
        w = e.rect.width;
        h = e.rect.height;
        x = e.rect.left;
        y = e.rect.top;
        el.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px;z-index:${z}`;
      });

    return () => { if (unsub) unsub(); };
  });

  function doClose() {
    windows.close(id);
  }
</script>

<div class="win {active ? '' : 'inactive'}" id={id}
     style={`left:${x}px;top:${y}px;width:${w}px;height:${h}px;z-index:${z}`}>

  <div class="win-titlebar">
    <div class="xp-title">{album.album.title} – {album.album.artist}</div>
    <div class="xp-controls" aria-hidden="true">
      <div class="xp-btn" title="Minimieren">
        <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMicgaGVpZ2h0PScxMicgdmlld0JveD0nMCAwIDEyIDEyJz48cmVjdCB4PScyJyB5PSc2JyB3aWR0aD0nOCcgaGVpZ2h0PScyJyBmaWxsPSdibGFjaycvPjwvc3ZnPg==" alt="-" />
      </div>
      <div class="xp-btn" title="Maximieren">
        <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nMTInIGhlaWdodD0nMTInIHZpZXdCb3g9JzAgMCAxMiAxMicgeG1sbnM9J2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJz48cmVjdCB4PScyJyB5PScyJyB3aWR0aD0nOCcgaGVpZ2h0PSc4JyBmaWxsPSdub25lJyBzdHJva2U9J2JsYWNrJyBzdHJva2Utd2lkdGg9JzEnLz48L3N2Zz4=" alt="[]" />
      </div>
      <div id="close-btn" class="xp-btn" title="Schliessen" on:click={doClose}>
        <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nMTInIGhlaWdodD0nMTInIHZpZXdCb3g9JzAgMCAxMiAxMicgeG1sbnM9J2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJz48bGluZSB4MT0nMycgeTE9JzMnIHgyPSc5JyB5Mj0nOScgc3Ryb2tlPSdibGFjaycgc3Ryb2tlLXdpZHRoPScyJy8+PGxpbmUgeDE9JzknIHkxPSczJyB4Mj0nMycgeTI9JzknIHN0cm9rZT0nYmxhY2snIHN0cm9rZS13aWR0aD0nMicvPjwvc3ZnPg==" alt="x" />
      </div>
    </div>
  </div>

  <div class="win-toolbar">
    {#if album.labels?.length}
      {#each album.labels as lb}
        <span class="chip">Label: {lb}</span>
      {/each}
    {/if}
    {#if album.album.genres?.[0]}
      <span class="chip">Genre: {album.album.genres[0]}</span>
    {/if}
  </div>

  <div class="win-content">
    <div class="cover pixelframe">
      {#if getState(album, cacheMap)?.url}
        <img alt="Cover" src={getState(album, cacheMap).url} class="pixel-img"
          on:error={() => markBrokenFor(album)} />
      {:else}
        COVER
      {/if}
    </div>

    <div>
      <table class="info">
        <tbody>
          <tr><th>Album</th><td>{album.album.title}</td></tr>
          <tr><th>Artist</th><td>{album.album.artist}</td></tr>
          <tr><th>Jahr</th><td>{album.album.year}</td></tr>
          <tr><th>Genres</th><td>{album.album.genres.join(', ')}</td></tr>
          <tr><th>Länge</th><td>{album.album.length}</td></tr>
          {#if album.favTrack}<tr><th>Lieblingslied</th><td>{album.favTrack}</td></tr>{/if}
          {#if album.rating != null}<tr><th>Rating</th><td>{album.rating}/10</td></tr>{/if}
        </tbody>
      </table>

      {#if album.note}
        <div class="note">{album.note}</div>
      {/if}
    </div>
  </div>

  <div class="win-status">
    <span>{album.date}</span>
    <span>Cover: iTunes / MusicBrainz</span>
  </div>
</div>
