import { useState, useMemo, useCallback } from 'react';
import {
  getComparisonList,
  addToComparison,
  removeFromComparison,
} from '../../../features/comparison/model/comparison';
import { parseAmountInput } from '../../../entities/currency/model/format';
import { computeComparisons } from '../../../use-cases/useComparisonConversion';
import { CURRENCIES } from '../../../entities/currency/model/currencies';
import { formatAmount } from '../../shared/formatting';

export interface ComparisonItem {
  code: string;
  name: string;
  convertedDisplay: string;
}

export interface AvailableCurrency {
  code: string;
  name: string;
}

export interface ComparisonVMState {
  items: ComparisonItem[];
  comparisonCodes: string[];
  isAdding: boolean;
  availableCurrencies: AvailableCurrency[];
  handleAdd: (code: string) => void;
  handleRemove: (code: string) => void;
  handleToggleAdding: () => void;
}

export function useComparisonVM(
  amount: string,
  sourceCurrency: string,
  rates: Record<string, number> | null,
): ComparisonVMState {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isAdding, setIsAdding] = useState(false);

  const comparisonCodes = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    refreshKey; // dependency to force re-read
    return getComparisonList();
  }, [refreshKey]);

  // Delegate conversion to use-case layer, then format in ViewModel
  const items: ComparisonItem[] = useMemo(() => {
    const numericAmount = parseAmountInput(amount);
    const results = computeComparisons(numericAmount, sourceCurrency, comparisonCodes, rates);
    return results.map((r) => ({
      code: r.code,
      name: r.name,
      convertedDisplay: formatAmount(r.value, r.code),
    }));
  }, [amount, sourceCurrency, rates, comparisonCodes]);

  // Pre-compute available currencies for View (removes need for View to import CURRENCIES)
  const availableCurrencies: AvailableCurrency[] = useMemo(() => {
    return CURRENCIES
      .filter((c) => !comparisonCodes.includes(c.code) && c.code !== sourceCurrency)
      .map((c) => ({ code: c.code, name: c.name }));
  }, [comparisonCodes, sourceCurrency]);

  const handleAdd = useCallback(
    (code: string) => {
      addToComparison(code);
      setRefreshKey((k) => k + 1);
      setIsAdding(false);
    },
    [],
  );

  const handleRemove = useCallback(
    (code: string) => {
      removeFromComparison(code);
      setRefreshKey((k) => k + 1);
    },
    [],
  );

  const handleToggleAdding = useCallback(() => {
    setIsAdding((prev) => !prev);
  }, []);

  return {
    items,
    comparisonCodes,
    isAdding,
    availableCurrencies,
    handleAdd,
    handleRemove,
    handleToggleAdding,
  };
}
