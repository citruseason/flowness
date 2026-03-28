interface TrendIndicatorProps {
  direction: 'up' | 'down' | 'stable';
  displayPercentage: string;
}

export function TrendIndicator({ direction, displayPercentage }: TrendIndicatorProps) {
  const arrow =
    direction === 'up' ? '\u25B2' : direction === 'down' ? '\u25BC' : '\u25C6';
  const colorClass =
    direction === 'up'
      ? 'trend-up'
      : direction === 'down'
        ? 'trend-down'
        : 'trend-stable';

  return (
    <span className={`trend-indicator ${colorClass}`} data-testid="trend-indicator">
      {arrow} {displayPercentage}
    </span>
  );
}
