<script>
  import '$lib/styles/xp.css';
  import { base } from '$app/paths';
</script>

<div class="bliss" style={`--bg-desktop: url('${base}/bg/bliss.webp'); --bg-mobile: url('${base}/bg/bliss_mobile.jpg')`}></div>
<main style="position:fixed; inset:0;">
  <slot />
</main>
