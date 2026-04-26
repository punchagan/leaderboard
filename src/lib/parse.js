import Papa from 'papaparse';
import { getGroup } from './genderMap.js';

const sheetId = import.meta.env.VITE_SHEET_ID;
const SHEET_URL = import.meta.env.DEV
  ? `${import.meta.env.BASE_URL}leaderboard.csv`
  : `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

export async function fetchData() {
  const res = await fetch(SHEET_URL);
  if (!res.ok) throw new Error(`Failed to fetch sheet: ${res.status}`);

  const title = parseTitleFromHeaders(res.headers);
  const text = await res.text();
  const { data } = Papa.parse(text, { skipEmptyLines: true });
  const all = extractPlayers(data);
  const queens = rankPlayers(all.filter((p) => p.group === 'queen'));
  const kings = rankPlayers(all.filter((p) => p.group === 'king'));
  console.log('queens:', queens);
  console.log('kings:', kings);

  return { title, queens, kings };
}

function extractPlayers(rows) {
  const dateRow = rows[0];

  // Build session groups: scan row 0 for non-empty date cells starting at col 2
  const sessionGroups = [];
  let current = null;
  for (let col = 2; col < dateRow.length; col++) {
    const val = dateRow[col]?.trim();
    if (val) {
      if (current) sessionGroups.push(current);
      current = { date: val, cols: [col] };
    } else if (current) {
      current.cols.push(col);
    }
  }
  if (current) sessionGroups.push(current);

  // Player rows start at index 2; skip rows with no name
  const players = [];
  for (let r = 2; r < rows.length; r++) {
    const row = rows[r];
    const name = row[0]?.trim();
    if (!name) continue;

    const totalPoints = parseFloat(row[1]) || 0;
    const sessions = sessionGroups.map((sg) => {
      const vals = sg.cols.map((c) => parseFloat(row[c] || '') || 0);
      return {
        date: sg.date,
        attendance: vals[0] || 0,
        games: vals.slice(1),
        hasData: vals.some((v) => v > 0),
      };
    });

    players.push({ name, group: getGroup(name), totalPoints, sessions });
  }

  return players;
}

function assignRanks(sorted, pointsKey) {
  sorted.forEach((p, i) => {
    p.rank = i > 0 && p[pointsKey] === sorted[i - 1][pointsKey]
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
    (a, b) => b.totalPoints - a.totalPoints || a.name.localeCompare(b.name)
  );
  assignRanks(ranked, 'totalPoints');

  if (hasPriorData) {
    // Compute each player's points before last weekend
    const withPrev = ranked.map((p) => {
      const lastWeekendPts = lastWeekendIndices.reduce((sum, i) => {
        const s = p.sessions[i];
        return sum + s.attendance + s.games.reduce((a, b) => a + b, 0);
      }, 0);
      return { ...p, prevPoints: p.totalPoints - lastWeekendPts };
    });

    const prevRanked = [...withPrev].sort(
      (a, b) => b.prevPoints - a.prevPoints || a.name.localeCompare(b.name)
    );
    assignRanks(prevRanked, 'prevPoints');
    const prevRankMap = Object.fromEntries(prevRanked.map((p) => [p.name, p.rank]));

    ranked.forEach((p) => {
      p.prevRank = prevRankMap[p.name] ?? p.rank;
      p.rankChange = p.prevRank - p.rank; // positive = moved up
    });
  } else {
    ranked.forEach((p) => { p.rankChange = 0; });
  }

  return ranked;
}

function parseTitleFromHeaders(headers) {
  const disposition = headers.get('content-disposition') ?? '';
  const match =
    disposition.match(/filename\*=UTF-8''([^;]+)/) ||
    disposition.match(/filename="([^"]+)"/);
  const fromHeader = match
    ? decodeURIComponent(match[1])
        .replace(/\.csv$/i, '')
        .replace(/\s*-\s*(public|copy|sheet\d*)$/i, '')
        .trim()
    : null;
  return fromHeader || import.meta.env.VITE_TITLE || 'Leaderboard';
}
