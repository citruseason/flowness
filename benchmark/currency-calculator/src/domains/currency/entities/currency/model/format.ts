/**
 * Parse user input string to a numeric amount.
 * This is business validation logic (belongs in Model layer).
 */
export function parseAmountInput(input: string): number {
  const trimmed = input.trim();
  if (trimmed === '') return 0;
  const parsed = Number(trimmed);
  return parsed;
}
