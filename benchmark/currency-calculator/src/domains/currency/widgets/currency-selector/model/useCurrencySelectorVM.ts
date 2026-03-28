import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { searchCurrencies } from '../../../features/search/model/searchCurrencies';
import { getCurrencyByCode } from '../../../entities/currency/model/currencies';
import type { Currency } from '../../../entities/currency/model/types';

const RECENT_KEY = 'currency-calculator-recent';
const MAX_RECENT = 5;

function loadRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

function saveRecent(codes: string[]): void {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(codes));
  } catch {
    // ignore
  }
}

export function addToRecent(code: string): void {
  const recent = loadRecent().filter((c) => c !== code);
  recent.unshift(code);
  saveRecent(recent.slice(0, MAX_RECENT));
}

/**
 * Convert a two-letter country code to its flag emoji.
 * This is a data transformation that belongs in the ViewModel layer.
 */
export function getFlagEmoji(countryCode: string): string {
  // Special cases
  if (countryCode === 'eu') return '\uD83C\uDDEA\uD83C\uDDFA';

  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 0x1f1e6 + char.charCodeAt(0) - 65);
  return String.fromCodePoint(...codePoints);
}

export interface CurrencySelectorVMState {
  isOpen: boolean;
  searchQuery: string;
  filteredCurrencies: Currency[];
  recentCurrencies: Currency[];
  highlightedIndex: number;
  selectedCurrency: Currency | undefined;
  selectedFlagEmoji: string;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  getFlagEmoji: (countryCode: string) => string;
  handleOpen: () => void;
  handleClose: () => void;
  handleSearchChange: (query: string) => void;
  handleSelect: (code: string) => void;
  handleKeyDown: (key: string) => void;
}

export function useCurrencySelectorVM(
  selectedCode: string,
  onCurrencyChange: (code: string) => void,
): CurrencySelectorVMState {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Provide selected currency data from ViewModel (not from View)
  const selectedCurrency = useMemo(
    () => getCurrencyByCode(selectedCode),
    [selectedCode],
  );

  // Pre-format the selected flag emoji (ViewModel transforms data for View)
  const selectedFlagEmoji = useMemo(
    () => (selectedCurrency?.flag ? getFlagEmoji(selectedCurrency.flag) : ''),
    [selectedCurrency],
  );

  const filteredCurrencies = useMemo(
    () => searchCurrencies(searchQuery),
    [searchQuery],
  );

  const recentCurrencies = useMemo(() => {
    const recentCodes = loadRecent();
    return searchCurrencies('')
      .filter((c) => recentCodes.includes(c.code))
      .sort(
        (a, b) =>
          recentCodes.indexOf(a.code) - recentCodes.indexOf(b.code),
      );
  }, [isOpen]); // Re-compute when opening

  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchQuery]);

  // Focus search input when opened (UI behavior managed by ViewModel)
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Close on outside click (UI behavior managed by ViewModel)
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setSearchQuery('');
    setHighlightedIndex(0);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSearchQuery('');
  }, []);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleSelect = useCallback(
    (code: string) => {
      addToRecent(code);
      onCurrencyChange(code);
      setIsOpen(false);
      setSearchQuery('');
    },
    [onCurrencyChange],
  );

  const handleKeyDown = useCallback(
    (key: string) => {
      if (key === 'ArrowDown') {
        setHighlightedIndex((prev) =>
          Math.min(prev + 1, filteredCurrencies.length - 1),
        );
      } else if (key === 'ArrowUp') {
        setHighlightedIndex((prev) => Math.max(prev - 1, 0));
      } else if (key === 'Enter' && filteredCurrencies[highlightedIndex]) {
        handleSelect(filteredCurrencies[highlightedIndex].code);
      } else if (key === 'Escape') {
        setIsOpen(false);
      }
    },
    [filteredCurrencies, highlightedIndex, handleSelect],
  );

  return {
    isOpen,
    searchQuery,
    filteredCurrencies,
    recentCurrencies,
    highlightedIndex,
    selectedCurrency,
    selectedFlagEmoji,
    dropdownRef,
    searchInputRef,
    getFlagEmoji,
    handleOpen,
    handleClose,
    handleSearchChange,
    handleSelect,
    handleKeyDown,
  };
}
