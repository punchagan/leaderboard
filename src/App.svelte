<script>
  import { fetchData } from "./lib/parse.js";
  import Leaderboard from "./lib/Leaderboard.svelte";

  let queens = $state([]);
  let kings = $state([]);
  let loading = $state(true);
  $effect(() => {
    fetchData()
      .then((data) => {
        queens = data.queens;
        kings = data.kings;
      })
      .catch(console.error)
      .finally(() => {
        loading = false;
      });
  });
</script>

<main class="min-h-screen bg-slate-950 px-4 py-10">
  <img
    src="{import.meta.env.BASE_URL}hero.jpg"
    alt="Kings & Queens"
    class="block mx-auto mb-8 w-full max-w-sm rounded-2xl"
  />

  <div class="flex flex-col gap-12">
    <Leaderboard players={queens} label="♛ Queens" accent="#f472b6" {loading} />
    <div class="max-w-sm mx-auto w-full border-t border-slate-800"></div>
    <Leaderboard players={kings} label="♚ Kings" accent="#38bdf8" {loading} />
  </div>
</main>
