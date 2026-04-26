<script>
  import { slide } from "svelte/transition";
  import { sessionPoints } from "./parse.js";

  let { player, accent } = $props();
  let expanded = $state(false);

  const medalColor =
    player.rank === 1
      ? "#f59e0b"
      : player.rank === 2
      ? "#e2e8f0"
      : player.rank === 3
      ? "#b87333"
      : null;

  const changeLabel =
    player.rankChange > 0
      ? `↑${player.rankChange}`
      : player.rankChange < 0
      ? `↓${Math.abs(player.rankChange)}`
      : null;

  const changeClass = player.rankChange > 0 ? "text-green-400" : "text-red-400";

  const playedSessions = $derived(player.sessions.filter((s) => s.hasData));

  function formatDate(raw) {
    // raw is DD/MM/YY
    const [d, m, y] = raw.split("/");
    const date = new Date(2000 + parseInt(y), parseInt(m) - 1, parseInt(d));
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  }
</script>

{#if player.rank === 1}
  <div
    class="rounded-2xl mb-4 border cursor-pointer"
    style="background: {accent}18; border-color: {accent}55; box-shadow: 0 0 24px {accent}22"
    onclick={() => (expanded = !expanded)}
  >
    <div class="flex items-center gap-4 px-5 py-4">
      <span class="text-3xl leading-none">👑</span>
      <span class="flex-1 text-lg font-bold text-slate-100">{player.name}</span>
      {#if changeLabel}
        <span class="text-xs font-semibold {changeClass}">{changeLabel}</span>
      {/if}
      <span class="text-base font-bold tabular-nums" style="color: {accent}"
        >{player.totalPoints}</span
      >
    </div>
    {#if expanded}
      <div transition:slide class="px-5 pb-4">
        {@render SessionBreakdown(playedSessions, accent)}
      </div>
    {/if}
  </div>
{:else if player.rank <= 3}
  <div
    class="rounded-xl mb-2 border border-slate-800 cursor-pointer"
    style="background: {medalColor}12"
    onclick={() => (expanded = !expanded)}
  >
    <div class="flex items-center gap-3 px-4 py-3">
      <span
        class="text-xl font-bold w-6 text-center shrink-0"
        style="color: {medalColor}">{player.rank}</span
      >
      <span class="flex-1 font-semibold text-slate-200">{player.name}</span>
      {#if changeLabel}
        <span class="text-xs font-semibold {changeClass}">{changeLabel}</span>
      {/if}
      <span
        class="text-sm font-semibold tabular-nums"
        style="color: {medalColor}">{player.totalPoints}</span
      >
    </div>
    {#if expanded}
      <div transition:slide class="px-4 pb-3">
        {@render SessionBreakdown(playedSessions, accent)}
      </div>
    {/if}
  </div>
{:else}
  <div
    class="rounded-lg cursor-pointer hover:bg-slate-900 transition-colors"
    onclick={() => (expanded = !expanded)}
  >
    <div class="flex items-center gap-3 px-4 py-2.5">
      <span class="w-6 text-right text-slate-600 font-mono text-sm shrink-0"
        >{player.rank}</span
      >
      <span class="flex-1 text-slate-300">{player.name}</span>
      {#if changeLabel}
        <span class="text-xs font-semibold {changeClass}">{changeLabel}</span>
      {/if}
      <span class="text-sm tabular-nums text-slate-400"
        >{player.totalPoints}</span
      >
    </div>
    {#if expanded}
      <div transition:slide class="px-4 pb-3">
        {@render SessionBreakdown(playedSessions, accent)}
      </div>
    {/if}
  </div>
{/if}

<!-- inline component to avoid repetition -->
{#snippet SessionBreakdown(sessions, accent)}
  <div class="border-t border-slate-800 pt-3 mt-1 flex flex-col gap-2">
    {#each sessions as s}
      <div class="flex items-center gap-3 text-xs text-slate-400">
        <span class="w-16 shrink-0">{formatDate(s.date)}</span>
        <span class="flex gap-1">
          {#each s.games as g, i}
            {@const countedSoFar = s.games.slice(0, i).reduce((a, b) => a + b, 0)}
            {@const capped = countedSoFar >= 2}
            <span
              title={g ? (capped ? "Win (capped)" : "Win") : "Loss"}
              style={g && !capped ? `color: ${accent}` : ""}
              class={g && capped ? "opacity-25" : ""}
            >
              {g ? "●" : "○"}
            </span>
          {/each}
        </span>
        <span class="ml-auto tabular-nums" style="color: {accent}">
          +{sessionPoints(s)}
        </span>
      </div>
    {/each}
  </div>
{/snippet}
