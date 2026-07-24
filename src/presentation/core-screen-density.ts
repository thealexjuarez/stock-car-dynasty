export const TEAM_ACTION_CENTER_LIMIT = 5;
export const MARKET_MIN_VISIBLE_ROWS = 4;
export const LEAGUE_MIN_VISIBLE_ROWS = 8;
export const TIMING_TOWER_MIN_FONT_SIZE = 10;

export function sortCompactRows<T>(
  rows: readonly T[],
  score: (row: T) => number,
  stableLabel: (row: T) => string,
) {
  return [...rows].sort(
    (left, right) =>
      score(right) - score(left) ||
      stableLabel(left).localeCompare(stableLabel(right)),
  );
}

export function toggleSingleExpanded(currentId: string | null, rowId: string) {
  return currentId === rowId ? null : rowId;
}

export function toggleCompactTarget(
  currentIds: readonly string[],
  prospectId: string,
) {
  return currentIds.includes(prospectId)
    ? currentIds.filter((id) => id !== prospectId)
    : [...currentIds, prospectId];
}
