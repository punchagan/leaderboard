<script>
  import { fetchData } from './lib/parse.js';
  import Leaderboard from './lib/Leaderboard.svelte';

  let title = $state(null);
  let queens = $state([]);
  let kings = $state([]);
  $effect(() => {
    fetchData()
      .then((data) => {
        title = data.title;
        queens = data.queens;
        kings = data.kings;
      })
      .catch((e) => { title = 'Error: ' + e.message; });
  });
</script>

<main class="min-h-screen bg-slate-950 px-4 py-10">
  {#if title}
    <h1 class="text-4xl font-extrabold text-center mb-12"
      style="-webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; background-image: linear-gradient(to right, #f472b6, #38bdf8)">
      {title}
    </h1>
  {/if}
  <div class="flex flex-col gap-12">
    <Leaderboard players={queens} label="♛ Queens" accent="#f472b6" />
    <div class="max-w-sm mx-auto w-full border-t border-slate-800"></div>
    <Leaderboard players={kings} label="♚ Kings" accent="#38bdf8" />
  </div>
</main>
