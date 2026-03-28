import { useComparisonVM } from '../model/useComparisonVM';

interface ComparisonPanelWidgetProps {
  amount: string;
  sourceCurrency: string;
  rates: Record<string, number> | null;
}

export function ComparisonPanelWidget({
  amount,
  sourceCurrency,
  rates,
}: ComparisonPanelWidgetProps) {
  const vm = useComparisonVM(amount, sourceCurrency, rates);

  return (
    <div className="comparison-panel">
      <div className="comparison-header">
        <h2 className="comparison-title">Multi-Currency Comparison</h2>
        <button
          className="comparison-add-btn"
          onClick={vm.handleToggleAdding}
          type="button"
        >
          {vm.isAdding ? 'Cancel' : '+ Add Currency'}
        </button>
      </div>

      {vm.isAdding && (
        <div className="comparison-add-list">
          {vm.availableCurrencies.map((currency) => (
            <button
              key={currency.code}
              className="comparison-add-option"
              onClick={() => vm.handleAdd(currency.code)}
              type="button"
            >
              {currency.code} - {currency.name}
            </button>
          ))}
        </div>
      )}

      {vm.items.length > 0 ? (
        <div className="comparison-list" data-testid="comparison-list">
          {vm.items.map((item) => (
            <div key={item.code} className="comparison-item">
              <div className="comparison-item-info">
                <span className="comparison-code">{item.code}</span>
                <span className="comparison-name">{item.name}</span>
              </div>
              <div className="comparison-item-value">
                <span className="comparison-amount">{item.convertedDisplay}</span>
                <button
                  className="comparison-remove-btn"
                  onClick={() => vm.handleRemove(item.code)}
                  type="button"
                  aria-label={`Remove ${item.code}`}
                >
                  &times;
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="comparison-empty">
          {amount ? 'No comparison currencies available' : 'Enter an amount to see comparisons'}
        </div>
      )}
    </div>
  );
}
