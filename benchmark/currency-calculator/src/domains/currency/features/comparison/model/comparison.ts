const STORAGE_KEY = 'currency-calculator-comparison';
const DEFAULT_CURRENCIES = ['USD', 'EUR', 'JPY', 'GBP', 'CNY'];

function load(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...DEFAULT_CURRENCIES];
    return JSON.parse(raw) as string[];
  } catch {
    return [...DEFAULT_CURRENCIES];
  }
}

function save(list: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // localStorage might be unavailable
  }
}

export function getComparisonList(): string[] {
  return load();
}

export function addToComparison(code: string): void {
  const list = load();
  if (list.includes(code)) return;
  list.push(code);
  save(list);
}

export function removeFromComparison(code: string): void {
  const list = load().filter((c) => c !== code);
  save(list);
}
