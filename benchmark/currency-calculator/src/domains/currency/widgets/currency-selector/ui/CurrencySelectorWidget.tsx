import { useCurrencySelectorVM } from '../model/useCurrencySelectorVM';

interface CurrencySelectorWidgetProps {
  selectedCode: string;
  onCurrencyChange: (code: string) => void;
}

/**
 * Pure View component: renders ViewModel state, delegates all behavior to ViewModel.
 * No useEffect, no utility functions, no direct DOM manipulation.
 */
export function CurrencySelectorWidget({
  selectedCode,
  onCurrencyChange,
}: CurrencySelectorWidgetProps) {
  const vm = useCurrencySelectorVM(selectedCode, onCurrencyChange);

  return (
    <div className="currency-selector" ref={vm.dropdownRef}>
      <button
        className="currency-selector-trigger"
        onClick={vm.isOpen ? vm.handleClose : vm.handleOpen}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={vm.isOpen}
      >
        <span className="currency-flag">{vm.selectedFlagEmoji}</span>
        <span className="currency-code">{selectedCode}</span>
        <span className="currency-name-short">{vm.selectedCurrency?.name ?? ''}</span>
        <span className="selector-arrow">{vm.isOpen ? '\u25B2' : '\u25BC'}</span>
      </button>

      {vm.isOpen && (
        <div className="currency-dropdown" role="listbox">
          <input
            ref={vm.searchInputRef}
            className="currency-search-input"
            type="text"
            value={vm.searchQuery}
            onChange={(e) => vm.handleSearchChange(e.target.value)}
            onKeyDown={(e) => vm.handleKeyDown(e.key)}
            placeholder="Search by name or code..."
            autoComplete="off"
          />

          {vm.recentCurrencies.length > 0 && !vm.searchQuery && (
            <div className="currency-recent-section">
              <div className="currency-section-label">Recent</div>
              {vm.recentCurrencies.map((currency) => (
                <button
                  key={`recent-${currency.code}`}
                  className={`currency-option ${currency.code === selectedCode ? 'selected' : ''}`}
                  onClick={() => vm.handleSelect(currency.code)}
                  role="option"
                  aria-selected={currency.code === selectedCode}
                  type="button"
                >
                  <span className="currency-flag">{vm.getFlagEmoji(currency.flag)}</span>
                  <span className="currency-code">{currency.code}</span>
                  <span className="currency-full-name">{currency.name}</span>
                </button>
              ))}
            </div>
          )}

          <div className="currency-all-section">
            {vm.searchQuery && <div className="currency-section-label">Results</div>}
            {!vm.searchQuery && <div className="currency-section-label">All Currencies</div>}
            {vm.filteredCurrencies.map((currency, index) => (
              <button
                key={currency.code}
                className={`currency-option ${currency.code === selectedCode ? 'selected' : ''} ${index === vm.highlightedIndex ? 'highlighted' : ''}`}
                onClick={() => vm.handleSelect(currency.code)}
                role="option"
                aria-selected={currency.code === selectedCode}
                type="button"
              >
                <span className="currency-flag">{vm.getFlagEmoji(currency.flag)}</span>
                <span className="currency-code">{currency.code}</span>
                <span className="currency-full-name">{currency.name}</span>
              </button>
            ))}
            {vm.filteredCurrencies.length === 0 && (
              <div className="currency-no-results">No currencies found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
