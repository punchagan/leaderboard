import Papa from "papaparse";

const sheetId = import.meta.env.VITE_SHEET_ID;
const SHEET_URL = import.meta.env.DEV
  ? `${import.meta.env.BASE_URL}leaderboard.csv`
  : `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

export async function fetchData() {
  const res = await fetch(SHEET_URL);
  if (!res.ok) throw new Error(`Failed to fetch sheet: ${res.status}`);

  const text = await res.text();
  const { data } = Papa.parse(text, { skipEmptyLines: true });
  const all = extractPlayers(data);
  const queens = rankPlayers(all.filter((p) => p.group === "queen"));
  const kings = rankPlayers(all.filter((p) => p.group === "king"));
  console.log("queens:", queens);
  console.log("kings:", kings);

  return { queens, kings };
}

function extractPlayers(rows) {
  const numCols = Math.max(rows[0].length, rows[1].length);
  // row0h: dates and top-level labels; row1h: column types within sessions
  const row0h = Array.from({ length: numCols }, (_, c) => rows[0][c]?.trim().toLowerCase() || "");
  const row1h = Array.from({ length: numCols }, (_, c) => rows[1][c]?.trim().toLowerCase() || "");

  const nameCol = row1h.findIndex((h) => h === "name");
  const genderCol = row1h.findIndex((h) => h === "m/f");

  // Session groups start at columns whose row-0 value looks like a date (DD/MM/YY)
  const isDate = (v) => /^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(v);
  const sessionGroups = [];
  let current = null;
  for (let col = 0; col < numCols; col++) {
    if (isDate(row0h[col])) {
      if (current) sessionGroups.push(current);
      current = { date: row0h[col], cols: [col] };
    } else if (current && row1h[col]) {
      current.cols.push(col);
    }
  }
  if (current) sessionGroups.push(current);

  // Player rows start at index 2; skip rows with no name
  const players = [];
  for (let r = 2; r < rows.length; r++) {
    const row = rows[r];
    const name = row[nameCol]?.trim();
    if (!name) continue;
    const group = row[genderCol]?.trim().toLowerCase() === "f" ? "queen" : "king";

    const sessions = sessionGroups.map((sg) => {
      const attendanceCol = sg.cols.find((c) => row1h[c] === "attendance");
      const gameCols = sg.cols.filter((c) => row1h[c].startsWith("game"));
      const attendance = parseFloat(row[attendanceCol] || "") || 0;
      const games = gameCols.map((c) => parseFloat(row[c] || "") || 0);
      return {
        date: sg.date,
        attendance,
        games,
        hasData: attendance > 0 || games.some((v) => v > 0),
      };
    });

    const totalPoints = sessions.reduce((sum, s) => sum + sessionPoints(s), 0);

    players.push({ name, group, totalPoints, sessions });
  }

  return players;
}

export function sessionPoints(s) {
  const gamePts = Math.min(s.games.reduce((a, b) => a + b, 0), 2);
  return s.attendance + gamePts;
}

function assignRanks(sorted, pointsKey) {
  sorted.forEach((p, i) => {
    p.rank =
      i > 0 && p[pointsKey] === sorted[i - 1][pointsKey]
        ? sorted[i - 1].rank
        : i + 1;
  });
}

function rankPlayers(players) {
  // Find the last 2 sessions that have any data (last weekend)
  const numSessions = players[0]?.sessions.length ?? 0;
  const populatedIndices = [];
  for (let i = 0; i < numSessions; i++) {
    if (players.some((p) => p.sessions[i]?.hasData)) populatedIndices.push(i);
  }
  const lastWeekendIndices = populatedIndices.slice(-2);
  const hasPriorData = populatedIndices.length > lastWeekendIndices.length;

  // Sort by current points, then name as tiebreaker
  const ranked = [...players].sort(
    (a, b) => b.totalPoints - a.totalPoints || a.name.localeCompare(b.name),
  );
  assignRanks(ranked, "totalPoints");

  if (hasPriorData) {
    // Compute each player's points before last weekend
    const withPrev = ranked.map((p) => {
      const lastWeekendPts = lastWeekendIndices.reduce((sum, i) => {
        const s = p.sessions[i];
        return sum + sessionPoints(s);
      }, 0);
      return { ...p, prevPoints: p.totalPoints - lastWeekendPts };
    });

    const prevRanked = [...withPrev].sort(
      (a, b) => b.prevPoints - a.prevPoints || a.name.localeCompare(b.name),
    );
    assignRanks(prevRanked, "prevPoints");
    const prevRankMap = Object.fromEntries(
      prevRanked.map((p) => [p.name, p.rank]),
    );

    ranked.forEach((p) => {
      p.prevRank = prevRankMap[p.name] ?? p.rank;
      p.rankChange = p.prevRank - p.rank; // positive = moved up
    });
  } else {
    ranked.forEach((p) => {
      p.rankChange = 0;
    });
  }

  return ranked;
}
