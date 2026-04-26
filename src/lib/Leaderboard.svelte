<script>
  import PlayerRow from './PlayerRow.svelte';

  let { players, label, accent } = $props();
</script>

<section class="w-full max-w-sm mx-auto">
  <h2 class="text-2xl font-bold text-center mb-6" style="color: {accent}">{label}</h2>
  <div class="flex flex-col">
    {#each players as player (player.name)}
      <PlayerRow {player} {accent} />
    {/each}
  </div>
</section>
