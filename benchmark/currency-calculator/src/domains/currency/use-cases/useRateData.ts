import { useState, useEffect, useCallback } from 'react';
import { fetchLatestRates, fetchHistoricalRates, RateCache } from '../entities/rate/api/rateApi';
import type { RateData } from '../entities/rate/api/rateApi';

const rateCache = new RateCache();

export type RateDataStatus = 'loading' | 'success' | 'error';

export interface RateDataState {
  status: RateDataStatus;
  rateData: RateData | null;
  historicalRateData: RateData | null;
  fetchError: Error | null;
  refresh: () => void;
}

/**
 * Presenter-layer hook: orchestrates rate data fetching, caching, and error handling.
 * Returns raw data with a status discriminator and raw Error.
 * UI state derivation (isLoading, errorMessage display, isStale) is the ViewModel's responsibility.
 */
export function useRateData(): RateDataState {
  const [rateData, setRateData] = useState<RateData | null>(null);
  const [historicalRateData, setHistoricalRateData] = useState<RateData | null>(null);
  const [status, setStatus] = useState<RateDataStatus>('loading');
  const [fetchError, setFetchError] = useState<Error | null>(null);

  const fetchRates = useCallback(async () => {
    setStatus('loading');
    setFetchError(null);
    try {
      const [latest, historical] = await Promise.all([
        fetchLatestRates('EUR'),
        fetchHistoricalRates('EUR', getYesterdayDate()),
      ]);
      setRateData(latest);
      setHistoricalRateData(historical);
      rateCache.set(latest);
      setStatus('success');
    } catch (err) {
      const cached = rateCache.get();
      if (cached) {
        setRateData(cached);
      }
      setFetchError(err instanceof Error ? err : new Error('Failed to fetch rates'));
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  return {
    status,
    rateData,
    historicalRateData,
    fetchError,
    refresh: fetchRates,
  };
}

function getYesterdayDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}
