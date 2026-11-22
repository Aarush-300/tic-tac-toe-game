// Some browsing modes expose localStorage but throw on access or writes.
export function readSaved(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeSaved(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // The in-memory game remains playable when persistence is unavailable.
  }
}

export function isCounter(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}
