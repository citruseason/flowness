interface RateStatusProps {
  lastUpdatedDisplay: string;
  isStale: boolean;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export function RateStatus({
  lastUpdatedDisplay,
  isStale,
  isLoading,
  error,
  onRefresh,
}: RateStatusProps) {
  return (
    <div className="rate-status">
      {lastUpdatedDisplay && (
        <span className={`rate-timestamp ${isStale ? 'rate-stale' : ''}`}>
          Last updated: {lastUpdatedDisplay}
          {isStale && (
            <span className="stale-warning" role="alert">
              {' '}(rates may be outdated)
            </span>
          )}
        </span>
      )}
      {error && lastUpdatedDisplay && (
        <span className="rate-error-inline" role="alert">
          {' '}Failed to refresh rates. Using cached data.
        </span>
      )}
      <button
        className="refresh-btn"
        onClick={onRefresh}
        disabled={isLoading}
        title="Refresh rates (Alt+R)"
        type="button"
      >
        {isLoading ? 'Refreshing...' : 'Refresh Rates'}
      </button>
    </div>
  );
}
