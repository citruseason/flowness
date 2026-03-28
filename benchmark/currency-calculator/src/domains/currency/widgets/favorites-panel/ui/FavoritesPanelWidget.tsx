import { useFavoritesVM } from '../model/useFavoritesVM';

interface FavoritesPanelWidgetProps {
  sourceCurrency: string;
  targetCurrency: string;
  onSelectPair: (source: string, target: string) => void;
}

export function FavoritesPanelWidget({
  sourceCurrency,
  targetCurrency,
  onSelectPair,
}: FavoritesPanelWidgetProps) {
  const vm = useFavoritesVM(sourceCurrency, targetCurrency, onSelectPair);

  return (
    <div className="favorites-panel">
      <div className="favorites-header">
        <button
          className={`favorite-toggle-btn ${vm.currentIsFavorite ? 'is-favorite' : ''}`}
          onClick={vm.handleToggleFavorite}
          type="button"
          aria-label={vm.currentIsFavorite ? 'Remove from favorites' : 'Add to favorites'}
          title={vm.currentIsFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {vm.currentIsFavorite ? '\u2605' : '\u2606'} {vm.currentIsFavorite ? 'Saved' : 'Save Pair'}
        </button>
      </div>

      {vm.favorites.length > 0 && (
        <div className="favorites-list" data-testid="favorites-list">
          {vm.favorites.map((pair) => (
            <div key={`${pair.source}-${pair.target}`} className="favorite-item">
              <button
                className="favorite-pair-btn"
                onClick={() => vm.handleSelectPair(pair.source, pair.target)}
                type="button"
              >
                {pair.source} &rarr; {pair.target}
              </button>
              <button
                className="favorite-remove-btn"
                onClick={() => vm.handleRemove(pair.source, pair.target)}
                type="button"
                aria-label={`Remove ${pair.source} to ${pair.target}`}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
