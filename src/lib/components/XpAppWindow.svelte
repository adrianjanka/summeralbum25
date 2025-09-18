<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import interact from 'interactjs';
  const dispatch = createEventDispatcher();

  export let title = "adrian's sommerklänge 2025";
  export let id = 'xp-app';

  export let disableNew = false;

  let x = 0, y = 0, w = 980, h = 640, z = 10;
  const MIN_W = 760, MIN_H = 520;

  // Dropdown-Menüs
  let openMenu = null; // 'file'|'edit'|'view'|'help'|null
  function toggle(menu){ openMenu = openMenu === menu ? null : menu; }
  function closeMenus(){ openMenu = null; }

  export let offsetX = 0;
  export let offsetY = 0;

  function center() {
    const vw = window.innerWidth, vh = window.innerHeight;
    w = Math.min(w, vw - 32);
    h = Math.min(h, vh - 48);
    x = Math.max(16, Math.round((vw - w)/2));
    y = Math.max(24, Math.round((vh - h)/2));
    x += offsetX;
    y += offsetY;
  }

  onMount(() => {
    center();
    const el = document.getElementById(id);
    if (!el) return;

    const restrictSize = interact.modifiers && interact.modifiers.restrictSize
      ? interact.modifiers.restrictSize({ min: { width: MIN_W, height: MIN_H } })
      : null;

    interact(el)
      .draggable({
        allowFrom: '.xp-titlebar',
        listeners: { move(ev){ x+=ev.dx; y+=ev.dy; el.style.left=x+'px'; el.style.top=y+'px'; } }
      })
      .resizable({
        edges: { left:true, right:true, bottom:true, top:true },
        modifiers: restrictSize ? [restrictSize] : []
      })
      .on('resizemove', (ev)=>{
        w = ev.rect.width; h = ev.rect.height; x = ev.rect.left; y = ev.rect.top;
        el.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px;z-index:${z}`;
      });

    const onResize = ()=> center();
    const onDocClick = (e)=> {
      // ausserhalb der Menüleiste -> Menüs schliessen
      if (!e.target.closest || !e.target.closest('.menubar')) openMenu = null;
    };
    const onEsc = (e)=> { if (e.key === 'Escape') openMenu = null; };

    window.addEventListener('resize', onResize);
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onEsc);

    return ()=>{
      window.removeEventListener('resize', onResize);
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  });


  // Submenü-Status
  let openSub = null;
  let subTimers = { iconsize: null, grid: null, color: null, sortby: null, direction: null };
  let subDir = { iconsize: 'right', grid: 'right', color: 'right', sortby: 'right', direction: 'right' };

  function openSubmenu(key, ev) {
    // Hover öffnen + Richtung bestimmen
    openSub = key;
    // Flip wenn zu wenig Platz rechts
    const trigger = ev.currentTarget;
    const rect = trigger.getBoundingClientRect();
    const needed = 240; // ca. Breite Submenü
    subDir[key] = (window.innerWidth - rect.right) < needed ? 'left' : 'right';
  }

  function cancelSubClose(key) {
    if (subTimers[key]) { clearTimeout(subTimers[key]); subTimers[key] = null; }
  }

  function closeSubDelayed(key) {
    cancelSubClose(key);
    subTimers[key] = setTimeout(() => {
      if (openSub === key) openSub = null;
    }, 180); // kleines Hover-Delay für diagonale Bewegung
  }



  let helpModal = null; // 'about' | 'shortcuts' | 'feedback' | 'credits' | null
  function openHelp(which){ helpModal = which; openMenu = null; openSub = null; }
  function closeHelp(){ helpModal = null; }



</script>

<style>
  .xp-window{position:fixed;left:0;top:0;width:980px;height:640px;background:var(--xp-gray);border:1px solid var(--xp-border);border-radius:var(--win-radius);box-shadow:var(--win-shadow);overflow:hidden}

  .xp-titlebar{height:34px;display:flex;align-items:center;gap:8px;padding:0 8px;background:var(--xp-blue);color:#fff}
  .xp-title{font-weight:700;letter-spacing:.2px;font-size:13px}
  .xp-controls{margin-left:auto;display:flex;gap:4px}
  .xp-btn{width:18px;height:18px;border:1px solid rgba(0,0,0,.3);background:linear-gradient(#fff,#d7e6ff);box-shadow:inset 1px 1px 0 var(--xp-hi), inset -1px -1px 0 var(--xp-shadow);border-radius:2px}

  /* Body jetzt als Grid: Menubar + Content + Statusbar */
  .body{position:absolute;inset:34px 0 22px 0;display:grid;grid-template-rows:auto 1fr}

  /* Menubar mit Dropdowns */
  .menubar{display:flex;gap:16px;padding:6px 10px;background:#ece9d8;color:#000;font-size:13px;position:relative;z-index:2}
  .menuitem{position:relative;user-select:none;cursor:default}
  .menuitem:hover{background:rgba(0,0,0,.06);border-radius:4px}

  .popup{
    position:absolute;top:100%;left:0;min-width:220px;margin-top:2px;padding:6px;
    background:#fff;border:1px solid var(--xp-border);box-shadow:0 8px 18px rgba(0,0,0,.25);
    z-index:10
  }
  .popup .row{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:4px;cursor:pointer}
  .popup .row:hover{background:#e6eefb}
  .sep{height:1px;background:#e5e5e5;margin:6px 0}

  .row.disabled{ opacity:.5; pointer-events:none }

  /* Inhalt */
  .xp-content{overflow:auto;padding:12px;position:relative;z-index:1}

  /* Scrollbars */
  .xp-content::-webkit-scrollbar{width:14px;height:14px}
  .xp-content::-webkit-scrollbar-track{background:#ece9d8;border-left:1px solid var(--xp-border)}
  .xp-content::-webkit-scrollbar-thumb{background:linear-gradient(#fefefe,#dcdcdc);border:1px solid var(--xp-border);box-shadow:inset 1px 1px 0 var(--xp-hi), inset -1px -1px 0 var(--xp-shadow)}

  /* Statusbar */
  .xp-status{position:absolute;left:0;right:0;bottom:0;background:#efefef;border-top:1px solid var(--xp-border);padding:2px 8px;font-size:12px;display:flex;justify-content:space-between;align-items:center;height:22px}

  @media (max-width:1024px){ .xp-window{width:96vw;height:86vh} }

  .popup { position:absolute; top:100%; left:0; min-width:220px; margin-top:2px; padding:6px;
    background:#fff; border:1px solid var(--xp-border); box-shadow:0 8px 18px rgba(0,0,0,.25); z-index:10 }
  .row.has-sub{ position:relative; display:flex; align-items:center; justify-content:space-between; }
  .row .caret{ opacity:.7; }

  /* Submenü: standard rechts */
  .submenu{ position:absolute; top:0; left:100%; min-width:220px; background:#fff;
    border:1px solid var(--xp-border); box-shadow:0 8px 18px rgba(0,0,0,.25); padding:6px; }
  /* Flip nach links */
  .submenu.left{ left:auto; right:100%; }

  /* mobil: Submenü klappt nach unten */
  @media (max-width: 768px){
    .submenu{ left:0 !important; right:auto !important; top:100% !important; }
  }


  /* Modal im App-Fenster */
  .modal-wrap{
    position:absolute; inset:34px 0 22px 0;  /* innerhalb App-Fenster, über Content/unter Title/Status */
    display:grid; place-items:center; z-index:20;
  }
  .modal-backdrop{
    position:absolute; inset:0; background:rgba(0,0,0,.25);
  }
  .modal{
    position:relative; width:min(620px, 92%); background:#fff; color:#000;
    border:1px solid var(--xp-border); border-radius:6px;
    box-shadow:0 10px 30px rgba(0,0,0,.35);
  }
  .modal-title{
    height:32px; display:flex; align-items:center; gap:8px; padding:0 10px;
    background:var(--xp-blue); color:#fff; font-weight:700; border-bottom:1px solid rgba(0,0,0,.2);
  }
  .modal-body{ padding:12px 14px; max-height:60vh; overflow:auto; }
  .modal-actions{ display:flex; justify-content:flex-end; gap:8px; padding:8px 10px; background:#f2f2f2; border-top:1px solid #ddd; }
  .modal-btn{
    padding:6px 12px; border:1px solid var(--xp-border); border-radius:6px; background:#fff; cursor:pointer;
    box-shadow:inset 1px 1px 0 var(--xp-hi), inset -1px -1px 0 var(--xp-shadow);
  }
  .modal-list{ margin:6px 0 0 0; padding-left:18px; }
  .modal-list li{ margin:4px 0; }
  .modal-small{ font-size:12px; color:#333; }



</style>

<div class="xp-window" id={id} style={`left:${x}px;top:${y}px;width:${w}px;height:${h}px;z-index:${z}`}>
  <div class="xp-titlebar">
    <div class="xp-title">{title}</div>
    <div class="xp-controls" aria-hidden="true">
      <div class="xp-btn" title="Minimieren">
        <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMicgaGVpZ2h0PScxMicgdmlld0JveD0nMCAwIDEyIDEyJz48cmVjdCB4PScyJyB5PSc2JyB3aWR0aD0nOCcgaGVpZ2h0PScyJyBmaWxsPSdibGFjaycvPjwvc3ZnPg==" alt="-" />
      </div>
      <div class="xp-btn" title="Maximieren">
        <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nMTInIGhlaWdodD0nMTInIHZpZXdCb3g9JzAgMCAxMiAxMicgeG1sbnM9J2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJz48cmVjdCB4PScyJyB5PScyJyB3aWR0aD0nOCcgaGVpZ2h0PSc4JyBmaWxsPSdub25lJyBzdHJva2U9J2JsYWNrJyBzdHJva2Utd2lkdGg9JzEnLz48L3N2Zz4=" alt="[]" />
      </div>
      <div class="xp-btn" title="Schliessen">
        <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nMTInIGhlaWdodD0nMTInIHZpZXdCb3g9JzAgMCAxMiAxMicgeG1sbnM9J2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJz48bGluZSB4MT0nMycgeTE9JzMnIHgyPSc5JyB5Mj0nOScgc3Ryb2tlPSdibGFjaycgc3Ryb2tlLXdpZHRoPScyJy8+PGxpbmUgeDE9JzknIHkxPSczJyB4Mj0nMycgeTI9JzknIHN0cm9rZT0nYmxhY2snIHN0cm9rZS13aWR0aD0nMicvPjwvc3ZnPg==" alt="x" />
      </div>
    </div>
  </div>

  <div class="body" on:click|stopPropagation>
    <!-- Menubar mit Dropdowns -->
    <div class="menubar">
      <!-- File = Fenster-Aktionen -->
      <div class="menuitem" on:click|stopPropagation={() => toggle('file')}>
        <span>File</span>
        {#if openMenu === 'file'}
          <div class="popup" on:click|stopPropagation>
            <div class="row {disableNew ? 'disabled' : ''}"
                on:click={() => { if(!disableNew){ dispatch('app-new'); closeMenus(); } }}>
              Neues Fenster
            </div>
            <div class="row" on:click={() => { dispatch('app-close', { id }); closeMenus(); }}>
              Fenster schliessen
            </div>
            <div class="sep"></div>
            <div class="row" on:click={() => { dispatch('app-export-json'); closeMenus(); }}>
              Export → JSON
            </div>
            <div class="row" on:click={() => { dispatch('app-print'); closeMenus(); }}>
              Drucken…
            </div>
            <div class="sep"></div>
            <div class="row" on:click={() => { dispatch('app-quit'); closeMenus(); }}>
              Beenden
            </div>
          </div>
        {/if}
      </div>

      <!-- Edit = Fun/Display Controls -->
      <div class="menuitem" on:click|stopPropagation={() => toggle('edit')}>
        <span>Edit</span>
        {#if openMenu === 'edit'}
          <div class="popup" on:click|stopPropagation>
            <!-- Icongröße (Submenü) -->
            <div
              class="row has-sub"
              on:mouseenter={(e)=>{ cancelSubClose('iconsize'); openSubmenu('iconsize', e); }}
              on:mouseleave={()=> closeSubDelayed('iconsize')}
            >
              <span>Icongröße</span><span class="caret">›</span>
              {#if openSub === 'iconsize'}
                <div class="submenu {subDir.iconsize === 'left' ? 'left' : ''}"
                    on:mouseenter={()=> cancelSubClose('iconsize')}
                    on:mouseleave={()=> closeSubDelayed('iconsize')}>
                  <div class="row" on:click={()=>{ dispatch('edit-icon-size','sm'); closeMenus(); }}>Klein</div>
                  <div class="row" on:click={()=>{ dispatch('edit-icon-size','md'); closeMenus(); }}>Mittel</div>
                  <div class="row" on:click={()=>{ dispatch('edit-icon-size','lg'); closeMenus(); }}>Riesig</div>
                </div>
              {/if}
            </div>

            <div class="sep"></div>

            <!-- Grid-Layout (Submenü) -->
            <div
              class="row has-sub"
              on:mouseenter={(e)=>{ cancelSubClose('grid'); openSubmenu('grid', e); }}
              on:mouseleave={()=> closeSubDelayed('grid')}
            >
              <span>Grid-Layout</span><span class="caret">›</span>
              {#if openSub === 'grid'}
                <div class="submenu {subDir.grid === 'left' ? 'left' : ''}"
                    on:mouseenter={()=> cancelSubClose('grid')}
                    on:mouseleave={()=> closeSubDelayed('grid')}>
                  <div class="row" on:click={()=>{ dispatch('edit-grid-style','compact'); closeMenus(); }}>Kompakt</div>
                  <div class="row" on:click={()=>{ dispatch('edit-grid-style','cozy'); closeMenus(); }}>Cozy</div>
                  <div class="row" on:click={()=>{ dispatch('edit-grid-style','spacious'); closeMenus(); }}>Spacious</div>
                </div>
              {/if}
            </div>

            <div class="sep"></div>

            <!-- Farbmodus (Submenü) -->
            <div
              class="row has-sub"
              on:mouseenter={(e)=>{ cancelSubClose('color'); openSubmenu('color', e); }}
              on:mouseleave={()=> closeSubDelayed('color')}
            >
              <span>Farbmodus</span><span class="caret">›</span>
              {#if openSub === 'color'}
                <div class="submenu {subDir.color === 'left' ? 'left' : ''}"
                    on:mouseenter={()=> cancelSubClose('color')}
                    on:mouseleave={()=> closeSubDelayed('color')}>
                  <div class="row" on:click={()=>{ dispatch('edit-color-mode','classic'); closeMenus(); }}>Classic</div>
                  <div class="row" on:click={()=>{ dispatch('edit-color-mode','dark'); closeMenus(); }}>Dark</div>
                  <div class="row" on:click={()=>{ dispatch('edit-color-mode','matrix'); closeMenus(); }}>Matrix</div>
                  <div class="row" on:click={()=>{ dispatch('edit-color-mode','pop'); closeMenus(); }}>Pop</div>
                </div>
              {/if}
            </div>

            <div class="sep"></div>

            <!-- Random -->
            <div class="row" on:click={()=>{ dispatch('edit-random'); closeMenus(); }}>Random Album öffnen</div>
          </div>
        {/if}
      </div>

      <!-- View = Sort mit Submenüs -->
      <div class="menuitem" on:click|stopPropagation={() => toggle('view')}>
        <span>View</span>
        {#if openMenu === 'view'}
          <div class="popup" on:click|stopPropagation>
            <!-- Sortieren nach (Submenü) -->
            <div
              class="row has-sub"
              on:mouseenter={(e)=>{ cancelSubClose('sortby'); openSubmenu('sortby', e); }}
              on:mouseleave={()=> closeSubDelayed('sortby')}
            >
              <span>Sortieren nach</span><span class="caret">›</span>
              {#if openSub === 'sortby'}
                <div class="submenu {subDir.sortby === 'left' ? 'left' : ''}"
                    on:mouseenter={()=> cancelSubClose('sortby')}
                    on:mouseleave={()=> closeSubDelayed('sortby')}>
                  <div class="row" on:click={()=>{ dispatch('view-sort-by','date'); closeMenus(); }}>Datum (Standard)</div>
                  <div class="row" on:click={()=>{ dispatch('view-sort-by','album'); closeMenus(); }}>Albumtitel</div>
                  <div class="row" on:click={()=>{ dispatch('view-sort-by','year'); closeMenus(); }}>Jahr</div>
                  <div class="row" on:click={()=>{ dispatch('view-sort-by','artist'); closeMenus(); }}>Artist</div>
                  <div class="row" on:click={()=>{ dispatch('view-sort-by','genre'); closeMenus(); }}>Genre</div>
                  <div class="row" on:click={()=>{ dispatch('view-sort-by','length'); closeMenus(); }}>Länge</div>
                  <div class="row" on:click={()=>{ dispatch('view-sort-by','label'); closeMenus(); }}>Labels</div>
                  <div class="row" on:click={()=>{ dispatch('view-sort-by','rating'); closeMenus(); }}>Rating</div>
                </div>
              {/if}
            </div>

            <!-- Richtung (Submenü) -->
            <div
              class="row has-sub"
              on:mouseenter={(e)=>{ cancelSubClose('direction'); openSubmenu('direction', e); }}
              on:mouseleave={()=> closeSubDelayed('direction')}
            >
              <span>Richtung</span><span class="caret">›</span>
              {#if openSub === 'direction'}
                <div class="submenu {subDir.direction === 'left' ? 'left' : ''}"
                    on:mouseenter={()=> cancelSubClose('direction')}
                    on:mouseleave={()=> closeSubDelayed('direction')}>
                  <div class="row" on:click={()=>{ dispatch('view-direction','asc'); closeMenus(); }}>Aufsteigend</div>
                  <div class="row" on:click={()=>{ dispatch('view-direction','desc'); closeMenus(); }}>Absteigend</div>
                </div>
              {/if}
            </div>

            <div class="sep"></div>

            <!-- Reset -->
            <div class="row" on:click={()=>{ dispatch('view-reset'); closeMenus(); }}>Reset</div>
          </div>
        {/if}
      </div>


      <!-- Help -->
      <div class="menuitem" on:click|stopPropagation={() => toggle('help')}>
        <span>Help</span>
        {#if openMenu === 'help'}
          <div class="popup" on:click|stopPropagation>
            <div class="row" on:click={()=> openHelp('about')}>About – summeralbum25</div>
            <div class="row" on:click={()=> openHelp('shortcuts')}>Shortcuts</div>
            <div class="row" on:click={()=> openHelp('feedback')}>Feedback</div>
            <div class="row" on:click={()=> openHelp('credits')}>Credits & Lizenz</div>
          </div>
        {/if}
      </div>



    </div>

    <!-- Inhalt -->
    <div class="xp-content" on:click={closeMenus}>
      <slot />
    </div>

    {#if helpModal}
      <div class="modal-wrap" on:click={closeHelp}>
        <div class="modal-backdrop"></div>
        <div class="modal" on:click|stopPropagation>
          <div class="modal-title">
            {#if helpModal === 'about'}About – summeralbum25{/if}
            {#if helpModal === 'shortcuts'}Shortcuts{/if}
            {#if helpModal === 'feedback'}Feedback{/if}
            {#if helpModal === 'credits'}Credits & Lizenz{/if}
          </div>

          <div class="modal-body">
            {#if helpModal === 'about'}
              <p><b>adrian’s sommerklaenge 2025</b> – ein Ferien-Tagebuch<br/><br/>
              XP-Style UI, klickbare Album-Icons, Fenster mit Details.</p>
              <p class="modal-small">Version: 1.0 · Build: lokal · Host: adrianjanka.ch/summeralbum</p>
            {/if}

            {#if helpModal === 'shortcuts'}
              <ul class="modal-list">
                <li><b>⌘/Ctrl + F</b> – Filter öffnen</li>
                <li><b>⌘/Ctrl + R</b> – Random Album</li>
                <li><b>Pfeiltasten</b> – Icon-Navigation</li>
                <li><b>Enter</b> – Album öffnen</li>
                <li><b>Esc</b> – Menü/Popup schließen</li>
              </ul>
              <p class="modal-small">Hinweis: Shortcuts sind als Preview dokumentiert und werden später aktiviert.</p>
            {/if}

            {#if helpModal === 'feedback'}
              <p>Feedback willkommen!</p>
              <ul class="modal-list">
                <li>GitHub Issues (Repo): <a href="https://github.com/adrianjanka/summeralbum25/issues" target="_blank" rel="noreferrer">Issue erstellen</a></li>
                <li>Mail: <a href="mailto:adi.janka@bluewin.ch">adi.janka@bluewin.ch</a></li>
              </ul>
            {/if}

            {#if helpModal === 'credits'}
              <p><b>Credits</b></p>
              <ul class="modal-list">
                <li>Design & Code: Adrian</li>
                <li>Tech: SvelteKit, Vite, Interact.js</li>
                <li>UI-Stil: Windows XP-inspiriert</li>
              </ul>
              <p><b>Lizenz</b></p>
              <p class="modal-small">Keine Analytics. Cover-Bilder via API – Rechte bei den jeweiligen Rechteinhabern.</p>
            {/if}
          </div>

          <div class="modal-actions">
            <button class="modal-btn" on:click={closeHelp}>OK</button>
          </div>
        </div>
      </div>
    {/if}





  </div>


  <div class="xp-status">
    <span><slot name="status-left">70 Einträge · 04.07–10.09.2025</slot></span>
    <span><slot name="status-right">Sortierung: Datum</slot></span>
  </div>
</div>
