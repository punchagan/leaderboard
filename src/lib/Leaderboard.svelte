<script>
  import PlayerRow from "./PlayerRow.svelte";

  let { players, label, accent, loading = false } = $props();
</script>

<section class="w-full max-w-sm mx-auto">
  <h2 class="text-2xl font-bold text-center mb-6" style="color: {accent}">
    {label}
  </h2>
  {#if loading}
    <div class="flex justify-center py-10">
      <svg class="animate-spin w-8 h-8 opacity-50" style="color: {accent}" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
      </svg>
    </div>
  {:else}
    <div class="flex flex-col">
      {#each players as player (player.name)}
        <PlayerRow {player} {accent} />
      {/each}
    </div>
  {/if}
</section>
