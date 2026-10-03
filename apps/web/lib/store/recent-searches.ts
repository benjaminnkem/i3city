const KEY = "i3-recent-searches";
const MAX_ITEMS = 5;

export function readRecentSearches(): string[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function write(items: string[]): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    return;
  }
}

export function saveRecentSearch(term: string): string[] {
  const clean = term.trim();
  if (clean.length < 2) return readRecentSearches();
  const next = [
    clean,
    ...readRecentSearches().filter(
      (item) => item.toLowerCase() !== clean.toLowerCase(),
    ),
  ].slice(0, MAX_ITEMS);
  write(next);
  return next;
}

export function clearRecentSearches(): void {
  write([]);
}
