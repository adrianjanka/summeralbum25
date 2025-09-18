<script>
  import '$lib/styles/xp.css';
  import { base } from '$app/paths';
</script>

<div class="bliss" style={`background:url('${base}/bg/bliss.webp') center/cover no-repeat`}></div>
<main style="position:fixed; inset:0;">
  <slot />
</main>
