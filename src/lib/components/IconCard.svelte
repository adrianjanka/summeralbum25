<script>
  import { onMount } from 'svelte';
  import { coverCache, ensureCover, getState } from '$lib/stores/covers.js';
  import { markBrokenFor } from '$lib/utils/covers.js';
  import { selectedIcon } from '$lib/stores/selection.js';

  export let album;
  const key = album.album.title + album.album.artist;

  export let onOpen;

  // Datum-Label
  const dd = new Date(album.date);
  const label = dd.toLocaleDateString('de-CH',{day:'2-digit',month:'2-digit'}).replace(' ', '.');

  function initials(title){ return title.split(/\s+/).slice(0,3).map(w=>w[0]).join('').slice(0,3).toUpperCase(); }

  let cacheMap = new Map();
  const unsub = coverCache.subscribe(v => cacheMap = v);

  let el; let observed = false;
  function inViewLoad(node) {
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{
        if (e.isIntersecting && !observed) {
          observed = true;
          ensureCover(album);
          io.disconnect();
        }
      });
    }, { rootMargin: '200px' });
    io.observe(node);
    return { destroy(){ io.disconnect(); } };
  }

  function retry(e){
    e.stopPropagation();
    ensureCover(album);
  }


  let isSelected = false;
  $: selectedIcon.subscribe(val => {
    isSelected = val === key;
  });

  function handleClick() {
    selectedIcon.set(key);
  }
</script>

<div class="icon-card {isSelected ? 'selected' : ''}" on:click={handleClick} on:dblclick={()=> onOpen(album)} title={`${album.album.title} — ${album.album.artist}`} bind:this={el} use:inViewLoad>
  <div class="icon-wrap">
    {#if getState(album, cacheMap)?.url}
      <div class="thumb pixelframe">
        <img alt="Cover" src={getState(album, cacheMap).url} class="pixel-img"
            on:error={() => markBrokenFor(album)} />
      </div>
    {:else}
      <div class="thumb pixelframe">{initials(album.album.title)}</div>
    {/if}

    {#if getState(album, cacheMap)?.error || getState(album, cacheMap)?.none}
      <div class="retry-badge" title="Erneut versuchen" on:click={retry}>?</div>
    {/if}
  </div>
  <div class="icon-label">{label}</div>
</div>
