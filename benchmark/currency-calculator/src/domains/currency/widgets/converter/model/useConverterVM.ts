import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { parseAmountInput } from '../../../entities/currency/model/format';
import type { RateDataState } from '../../../use-cases/useRateData';
import { computeConversion, computeTrend } from '../../../use-cases/computeConversion';
import { formatAmount, formatRate, formatTrendDisplay, formatLastUpdated } from '../../shared/formatting';
import { SHORTCUTS, useKeyboardShortcuts } from '../../../features/keyboard-shortcuts/model/shortcuts';

const CACHE_MAX_AGE = 5 * 60 * 1000;

export interface TrendDisplay {
  direction: 'up' | 'down' | 'stable';
  displayPercentage: string;
}

export interface ShortcutDisplay {
  key: string;
  description: string;
}

export interface ConverterVMState {
  amount: string;
  sourceCurrency: string;
  targetCurrency: string;
  convertedDisplay: string;
  rateDisplay: string;
  isLoading: boolean;
  error: string | null;
  lastUpdatedDisplay: string;
  isStale: boolean;
  trend: TrendDisplay | null;
  rates: Record<string, number> | null;
  shortcuts: ShortcutDisplay[];
  amountInputRef: React.RefObject<HTMLInputElement | null>;
  handleAmountChange: (value: string) => void;
  handleSourceChange: (code: string) => void;
  handleTargetChange: (code: string) => void;
  handleSwap: () => void;
  handleRefresh: () => void;
  handleSelectFavoritePair: (source: string, target: string) => void;
}

/**
 * ViewModel: receives presenter data as parameter, transforms into display state.
 * Does NOT call data-fetching hooks -- that is the Presenter's responsibility.
 */
export function useConverterVM(presenterState: RateDataState): ConverterVMState {
  const [amount, setAmount] = useState('');
  const [sourceCurrency, setSourceCurrency] = useState('USD');
  const [targetCurrency, setTargetCurrency] = useState('EUR');
  const [debouncedAmount, setDebouncedAmount] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const amountInputRef = useRef<HTMLInputElement | null>(null);

  // Debounce amount changes
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setDebouncedAmount(amount);
    }, 300);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [amount]);

  const handleSwap = useCallback(() => {
    setSourceCurrency((prev) => {
      setTargetCurrency(prev);
      return targetCurrency;
    });
  }, [targetCurrency]);

  const handleRefresh = useCallback(() => {
    presenterState.refresh();
  }, [presenterState.refresh]);

  // Register keyboard shortcuts in ViewModel (keeps View free of feature imports)
  useKeyboardShortcuts({
    onSwap: handleSwap,
    onFocusAmount: () => amountInputRef.current?.focus(),
    onRefresh: handleRefresh,
  });

  // Delegate conversion to use-case layer, then format in ViewModel
  const conversionResult = useMemo(() => {
    if (!presenterState.rateData || !debouncedAmount) return null;
    const numericAmount = parseAmountInput(debouncedAmount);
    return computeConversion(numericAmount, sourceCurrency, targetCurrency, presenterState.rateData.rates);
  }, [presenterState.rateData, debouncedAmount, sourceCurrency, targetCurrency]);

  // Delegate trend computation to use-case layer, then format in ViewModel
  const trend: TrendDisplay | null = useMemo(() => {
    const trendResult = computeTrend(
      sourceCurrency,
      targetCurrency,
      presenterState.rateData?.rates ?? null,
      presenterState.historicalRateData?.rates ?? null,
    );
    if (!trendResult) return null;
    return {
      direction: trendResult.direction,
      displayPercentage: formatTrendDisplay(trendResult.percentageChange),
    };
  }, [presenterState.rateData, presenterState.historicalRateData, sourceCurrency, targetCurrency]);

  // ViewModel derives UI state from presenter's raw data
  const isLoading = presenterState.status === 'loading';

  const error = useMemo(() => {
    if (presenterState.status === 'error' && presenterState.fetchError) {
      return presenterState.fetchError.message;
    }
    return null;
  }, [presenterState.status, presenterState.fetchError]);

  // ViewModel derives isStale from rateData timestamp
  const isStale = useMemo(() => {
    if (!presenterState.rateData) return false;
    return Date.now() - presenterState.rateData.timestamp > CACHE_MAX_AGE;
  }, [presenterState.rateData]);

  // ViewModel transformations: raw data -> display strings
  const convertedDisplay = useMemo(() => {
    if (!conversionResult) return '';
    return formatAmount(conversionResult.value, targetCurrency);
  }, [conversionResult, targetCurrency]);

  const rateDisplay = useMemo(() => {
    if (!conversionResult) return '';
    return formatRate(sourceCurrency, targetCurrency, conversionResult.rate);
  }, [conversionResult, sourceCurrency, targetCurrency]);

  const lastUpdatedDisplay = useMemo(() => {
    return formatLastUpdated(presenterState.rateData?.timestamp ?? null);
  }, [presenterState.rateData]);

  // Provide shortcuts data for View (no direct feature import from View)
  const shortcuts: ShortcutDisplay[] = useMemo(() => {
    return SHORTCUTS.map((s) => ({ key: s.key, description: s.description }));
  }, []);

  const handleAmountChange = useCallback((value: string) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  }, []);

  const handleSourceChange = useCallback((code: string) => {
    setSourceCurrency(code);
  }, []);

  const handleTargetChange = useCallback((code: string) => {
    setTargetCurrency(code);
  }, []);

  // Single method for favorite pair selection (avoids inline orchestration in View)
  const handleSelectFavoritePair = useCallback((source: string, target: string) => {
    setSourceCurrency(source);
    setTargetCurrency(target);
  }, []);

  return {
    amount,
    sourceCurrency,
    targetCurrency,
    convertedDisplay,
    rateDisplay,
    isLoading,
    error,
    lastUpdatedDisplay,
    isStale,
    trend,
    rates: presenterState.rateData?.rates ?? null,
    shortcuts,
    amountInputRef,
    handleAmountChange,
    handleSourceChange,
    handleTargetChange,
    handleSwap,
    handleRefresh,
    handleSelectFavoritePair,
  };
}
