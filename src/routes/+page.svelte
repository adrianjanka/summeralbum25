<script>
  import XpAppWindow from '$lib/components/XpAppWindow.svelte';
  import IconCard from '$lib/components/IconCard.svelte';
  import XpWindow from '$lib/components/XpWindow.svelte';
  import { sortedAlbums, windows, sortBy } from '$lib/stores/windows';

  let list = [];
  const unsub = sortedAlbums.subscribe(v=> list = v);

  let wins = [];
  const uw = windows.subscribe(v=> wins = v);

  function open(a){ windows.openFor(a); }
  function setSort(k){ sortBy.set(k); }



let appWins = [{ id: 'xp-app-1' }];
let nextId = 2;
let showApp = true;

function addApp() {
  if (appWins.length >= 3) {
    alert('Maximal 3 Fenster erlaubt.');
    return;
  }
  const offset = appWins.length * 30; // z.B. 30px pro Fenster
  appWins = [...appWins, { id: `xp-app-${nextId++}`, xOffset: offset, yOffset: offset }];
}

function closeApp(id) {
  appWins = appWins.filter(x => x.id !== id);
  if (appWins.length === 0) addApp(); // immer mind. 1 Fenster offen halten
}

function exportJson() {
  const data = JSON.stringify(list, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'summeralbum25.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function doPrint() {
  window.print();
}

function quit() {
  // Versuche Tab zu schliessen; wenn blockiert: UI ausblenden
  window.close();
  showApp = false;
  document.body.style.background = '#fff';
}



// EDIT

let gridSize = 'md';        // 'sm' | 'md' | 'lg'
let gridStyle = 'cozy';     // 'compact' | 'cozy' | 'spacious'
let colorMode = 'classic';  // 'classic' | 'dark' | 'matrix' | 'pop'

function applyColorMode(mode) {
  // root-Classes für CSS-Varianten
  document.documentElement.classList.remove('mode-classic','mode-dark','mode-matrix','mode-pop');
  document.documentElement.classList.add(`mode-${mode}`);
  colorMode = mode;
}

function openRandomAlbum() {
  if (!list || list.length === 0) return;
  const idx = Math.floor(Math.random() * list.length);
  windows.openFor(list[idx]);
}



// VIEW
function setSortKey(key) {
  sortBy.update((s)=> ({ key, dir: s.dir || 'asc' }));
}
function setSortDir(dir) {
  sortBy.update((s)=> ({ key: s.key || 'date', dir }));
}
function resetSort() {
  sortBy.set({ key: 'date', dir: 'asc' });
}


</script>

{#if showApp}
  {#each appWins as w (w.id)}
  <XpAppWindow
  id={w.id}
  disableNew={appWins.length >= 3}
  offsetX={w.xOffset || 0}
  offsetY={w.yOffset || 0}
  on:sort={(e)=> setSort(e.detail)}

  on:app-new={addApp}
  on:app-close={(e)=> closeApp(e.detail && e.detail.id)}
  on:app-export-json={exportJson}
  on:app-print={doPrint}
  on:app-quit={quit}

  on:edit-icon-size={(e)=> gridSize = e.detail}
  on:edit-grid-style={(e)=> gridStyle = e.detail}
  on:edit-color-mode={(e)=> applyColorMode(e.detail)}
  on:edit-random={openRandomAlbum}

  on:view-sort-by={(e)=> setSortKey(e.detail)}
  on:view-direction={(e)=> setSortDir(e.detail)}
  on:view-reset={resetSort}
>

      <span slot="status-left">{list.length} Einträge · 04.07–10.09.2025</span>
      <span slot="status-right">Sortierung: Datum</span>

      <div class="grid {gridSize} {gridStyle}">
        {#each list as album}
            <IconCard {album} onOpen={open} />
        {/each}
      </div>


    </XpAppWindow>
  {/each}
{/if}

{#each wins as w (w.id)}
    <XpWindow id={w.id} album={w.album} x={w.x} y={w.y} w={w.w} h={w.h} z={w.z} active={w.active} />
{/each}
