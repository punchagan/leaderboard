// Edit this to fix any misclassifications, or add new players
export const QUEENS = new Set([
  "Dikshita",
  "Kat",
  "Khushboo",
  "Mansi",
  "Manvi",
  "Marie",
  "Sheetal",
  "Supreet",
]);

export function getGroup(name) {
  if (QUEENS.has(name)) return "queen";
  return "king";
}
