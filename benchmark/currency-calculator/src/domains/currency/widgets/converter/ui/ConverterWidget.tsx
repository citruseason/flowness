import { useConverterVM } from '../model/useConverterVM';
import { useRateData } from '../../../use-cases/useRateData';
import { CurrencySelectorWidget } from '../../currency-selector/ui/CurrencySelectorWidget';
import { ComparisonPanelWidget } from '../../comparison-panel/ui/ComparisonPanelWidget';
import { FavoritesPanelWidget } from '../../favorites-panel/ui/FavoritesPanelWidget';
import { TrendIndicator } from './TrendIndicator';
import { RateStatus } from './RateStatus';
import { ShortcutHelp } from './ShortcutHelp';

export function ConverterWidget() {
  // View wires Presenter to ViewModel (MVPVM pattern)
  const presenterState = useRateData();
  const vm = useConverterVM(presenterState);

  return (
    <div className="converter-layout">
      <div className="converter-main">
        <h1 className="converter-title">Currency Calculator</h1>

        <FavoritesPanelWidget
          sourceCurrency={vm.sourceCurrency}
          targetCurrency={vm.targetCurrency}
          onSelectPair={vm.handleSelectFavoritePair}
        />

        <div className="converter-card">
          <div className="converter-input-group">
            <label htmlFor="amount-input" className="converter-label">
              Amount
            </label>
            <input
              id="amount-input"
              ref={vm.amountInputRef}
              type="text"
              inputMode="decimal"
              className="converter-amount-input"
              value={vm.amount}
              onChange={(e) => vm.handleAmountChange(e.target.value)}
              placeholder="Enter amount"
              autoComplete="off"
            />
          </div>

          <div className="converter-currencies">
            <div className="converter-currency-group">
              <label className="converter-label">From</label>
              <CurrencySelectorWidget
                selectedCode={vm.sourceCurrency}
                onCurrencyChange={vm.handleSourceChange}
              />
            </div>

            <button
              className="converter-swap-btn"
              onClick={vm.handleSwap}
              aria-label="Swap currencies"
              title="Swap currencies (Alt+S)"
              type="button"
            >
              &#8646;
            </button>

            <div className="converter-currency-group">
              <label className="converter-label">To</label>
              <CurrencySelectorWidget
                selectedCode={vm.targetCurrency}
                onCurrencyChange={vm.handleTargetChange}
              />
            </div>
          </div>

          {vm.isLoading && (
            <div className="converter-loading" role="status">
              Loading rates...
            </div>
          )}

          {vm.error && !vm.rates && (
            <div className="converter-error" role="alert">
              {vm.error}
            </div>
          )}

          {vm.convertedDisplay && (
            <div className="converter-result">
              <div className="converter-converted-amount" data-testid="converted-amount">
                {vm.convertedDisplay}
              </div>
              <div className="converter-rate-info">
                <span className="converter-rate-display" data-testid="rate-display">
                  {vm.rateDisplay}
                </span>
                {vm.trend && (
                  <TrendIndicator
                    direction={vm.trend.direction}
                    displayPercentage={vm.trend.displayPercentage}
                  />
                )}
              </div>
            </div>
          )}

          <RateStatus
            lastUpdatedDisplay={vm.lastUpdatedDisplay}
            isStale={vm.isStale}
            isLoading={vm.isLoading}
            error={vm.error}
            onRefresh={vm.handleRefresh}
          />
        </div>
      </div>

      <div className="converter-sidebar">
        <ComparisonPanelWidget
          amount={vm.amount}
          sourceCurrency={vm.sourceCurrency}
          rates={vm.rates}
        />
        <ShortcutHelp shortcuts={vm.shortcuts} />
      </div>
    </div>
  );
}
