# Currency Calculator

## Overview

Currency Calculator is a real-time currency exchange rate web application that enables users to convert amounts between world currencies using live exchange rates. The application targets everyday users -- travelers, online shoppers, freelancers, and business professionals -- who need quick, accurate currency conversions without leaving the browser.

The product prioritizes speed and clarity. A user should be able to land on the page, enter an amount, select two currencies, and see the converted result instantly. Beyond the core conversion, the application provides rate trend context, multi-currency comparison, and offline resilience so that it remains useful in varied connectivity conditions.

The application supports 30+ major world currencies with rates sourced from a public exchange rate API, refreshed at configurable intervals. It is designed as a single-page application optimized for both desktop and mobile viewports.

## Features

### 1. Core Currency Conversion

The primary feature of the application. Users enter a monetary amount in one currency and see the equivalent value in another currency, updated in real-time as they type.

**User Stories:**
- As a user, I want to enter an amount and select source/target currencies so that I can see the converted value immediately.
- As a user, I want to swap the source and target currencies with a single action so that I can quickly check the reverse conversion.
- As a user, I want the conversion to update as I type (debounced) so that I do not have to press a submit button.
- As a user, I want to see the per-unit exchange rate (e.g., "1 USD = 1,342.50 KRW") alongside the converted amount so that I understand the rate being applied.
- As a user, I want numeric input to accept decimal values and reject non-numeric characters so that I cannot enter invalid amounts.

**Data Model:**
- **Currency**: code (ISO 4217, e.g., "USD"), name (e.g., "United States Dollar"), symbol (e.g., "$"), flag/icon identifier
- **Exchange Rate**: base currency code, target currency code, rate value, timestamp of last update
- **Conversion**: source currency, target currency, input amount, converted amount, rate applied, conversion timestamp

### 2. Currency Selector with Search

A currency picker that supports 30+ currencies with search/filter capability. Users can find currencies by code, name, or country.

**User Stories:**
- As a user, I want to search currencies by name, code, or country so that I can quickly find the currency I need without scrolling through a long list.
- As a user, I want to see the currency flag/icon, code, and full name in the selector so that I can visually distinguish currencies.
- As a user, I want recently used currencies to appear at the top of the selector so that my frequent conversions are faster.
- As a user, I want keyboard navigation within the currency selector so that I can pick a currency without using the mouse.

**Data Model:**
- **Currency Metadata**: code, display name, country/region, flag identifier, sort priority
- **Recently Used Currencies**: ordered list of currency codes per selector (source/target), persisted across sessions (max 5)

### 3. Live Exchange Rate Fetching and Caching

The application fetches exchange rates from a public API and caches them intelligently to minimize network requests while keeping rates reasonably fresh.

**User Stories:**
- As a user, I want to see when the exchange rates were last updated so that I know how current my conversion is.
- As a user, I want the application to display a visual indicator when rates are being refreshed so that I know the app is working.
- As a user, I want the application to continue working with cached rates when I am offline so that I can still perform conversions.
- As a user, I want to manually trigger a rate refresh so that I can get the latest rates on demand.

**Data Model:**
- **Rate Cache**: map of currency pairs to rates, last fetch timestamp, cache expiry duration, staleness indicator
- **Fetch Status**: loading state, last successful fetch time, last error (if any)

### 4. Multi-Currency Comparison View

A view that shows the converted amount in multiple target currencies simultaneously, giving users a quick overview of how their amount compares across currencies.

**User Stories:**
- As a user, I want to see my entered amount converted to multiple currencies at once so that I can compare values across countries.
- As a user, I want to add or remove currencies from the comparison list so that I see only the currencies relevant to me.
- As a user, I want the comparison list to persist across sessions so that I do not have to re-select currencies every time.
- As a user, I want to click any currency in the comparison view to make it the primary target currency so that I can switch contexts quickly.

**Data Model:**
- **Comparison List**: ordered list of currency codes selected by the user (default: USD, EUR, JPY, GBP, CNY), persisted across sessions
- **Comparison Result**: source amount, source currency, list of target conversions (currency + converted amount)

### 5. Favorite Currency Pairs

Users can bookmark frequently used currency pairs for one-tap access.

**User Stories:**
- As a user, I want to save currency pairs as favorites so that I can access my most common conversions instantly.
- As a user, I want to see my favorite pairs displayed prominently on the main screen so that I do not have to re-select currencies each visit.
- As a user, I want to remove a pair from favorites so that I can keep my list tidy.
- As a user, I want to reorder my favorite pairs so that the most important ones appear first.

**Data Model:**
- **Favorite Pair**: source currency code, target currency code, display order, creation timestamp
- **Favorites List**: ordered collection of favorite pairs, persisted in local storage (max 10)

### 6. Amount Formatting and Locale Awareness

Amounts are displayed with proper formatting -- thousands separators, decimal precision appropriate to each currency, and correct currency symbols.

**User Stories:**
- As a user, I want converted amounts displayed with the correct number of decimal places for each currency (e.g., 2 for USD, 0 for JPY, 3 for KWD) so that the output matches real-world usage.
- As a user, I want amounts to include thousands separators so that large numbers are easy to read.
- As a user, I want to see the correct currency symbol or code alongside each amount so that I know which currency I am looking at.
- As a user, I want the number formatting to respect my browser locale (e.g., comma vs. period for decimals) so that amounts look natural to me.

**Data Model:**
- **Currency Format**: currency code, decimal places, symbol position (prefix/suffix), symbol character

### 7. Historical Rate Indicator

A lightweight visual indicator showing whether the current rate has gone up, down, or remained stable compared to the previous day, giving users directional context.

**User Stories:**
- As a user, I want to see an arrow or indicator showing whether the rate has gone up or down compared to yesterday so that I know the trend direction.
- As a user, I want to see the percentage change from the previous day so that I can gauge the magnitude of movement.
- As a user, I want the indicator to use color coding (green for favorable, red for unfavorable) so that I can quickly interpret the trend.

**Data Model:**
- **Rate Trend**: currency pair, current rate, previous rate (24h ago), percentage change, direction (up/down/stable)

### 8. Responsive Layout and Mobile Optimization

The application adapts seamlessly between desktop and mobile viewports, with touch-optimized interactions on mobile.

**User Stories:**
- As a user on mobile, I want the converter to be fully usable on a phone-sized screen so that I can convert currencies on the go.
- As a user on mobile, I want the numeric keyboard to appear automatically when I tap the amount input so that I can enter numbers efficiently.
- As a user on desktop, I want the layout to use available screen space effectively, showing the comparison view alongside the main converter so that I can see everything at once.
- As a user, I want the currency selector to work as a full-screen modal on mobile and a dropdown on desktop so that the interaction feels native to each device.

### 9. Keyboard Shortcuts

Power users can perform common actions via keyboard shortcuts for faster workflow.

**User Stories:**
- As a user, I want to press a key to swap currencies so that I can reverse the conversion without reaching for the mouse.
- As a user, I want to press a key to focus the amount input so that I can start typing immediately.
- As a user, I want to press a key to refresh rates so that I can update rates hands-free.
- As a user, I want to see a list of available shortcuts via a help overlay so that I can discover keyboard shortcuts.

### 10. Error Handling and Offline Resilience

Graceful degradation when the network is unavailable or the API returns errors, ensuring the application remains useful.

**User Stories:**
- As a user, I want to see a clear message when exchange rates cannot be fetched so that I understand why the conversion might be stale.
- As a user, I want the application to retry fetching rates automatically after a network error so that I do not have to manually refresh.
- As a user, I want to see a "last updated" timestamp with a staleness warning when rates are older than the normal refresh interval so that I can decide whether to trust the displayed values.
- As a user, I want previously cached rates to remain available when I reopen the app offline so that I can still estimate conversions.

## Non-Goals

- **User accounts and authentication**: No login, registration, or server-side user data. All personalization is client-side (local storage).
- **Historical rate charts**: No line graphs, candlestick charts, or detailed historical data visualization. Only a simple directional indicator (up/down) is included.
- **Currency conversion API backend**: The application consumes a third-party exchange rate API directly from the client. No custom backend or proxy server is in scope.
- **Cryptocurrency support**: Only fiat currencies with ISO 4217 codes are supported.
- **Transaction or payment functionality**: The application is informational only -- it does not facilitate actual money transfers.
- **Push notifications**: No alerts for rate thresholds or significant rate changes.
- **Multi-language/i18n for UI labels**: The UI is in English. Number formatting respects locale, but UI strings are not translated.

## Success Criteria

Each criterion below is verifiable via browser interaction (Playwright) or observable behavior:

1. **Core conversion works**: Entering "100" with source "USD" and target "KRW" displays a non-zero converted amount and the per-unit rate.
2. **Real-time update on input**: Changing the input amount causes the converted value to update within 500ms without requiring a button press.
3. **Currency swap**: Clicking the swap button reverses source and target currencies and recalculates the conversion.
4. **Currency search**: Typing "yen" in the currency selector filters the list to show JPY. Typing "EUR" shows the Euro.
5. **Recently used currencies**: After selecting a currency, reopening the selector shows that currency in a "recent" section at the top.
6. **Rate timestamp visible**: The UI displays a human-readable "last updated" timestamp that changes after a manual refresh.
7. **Manual refresh**: A refresh button exists, and clicking it triggers a rate fetch (loading indicator appears and disappears).
8. **Multi-currency comparison**: A comparison panel shows the entered amount converted to at least 5 different currencies simultaneously.
9. **Comparison customization**: Users can add and remove currencies from the comparison list, and the changes persist after page reload.
10. **Favorite pairs**: Users can save a currency pair as a favorite, see it listed on the main screen, and click it to load that pair into the converter.
11. **Amount formatting**: JPY conversions display with zero decimal places. USD conversions display with two decimal places. Large amounts show thousands separators.
12. **Rate trend indicator**: The UI shows a directional indicator (up/down/stable) with a percentage change value next to the exchange rate.
13. **Mobile responsive**: At 375px viewport width, the converter is fully visible and operable without horizontal scrolling.
14. **Keyboard shortcut for swap**: Pressing the designated keyboard shortcut swaps the currencies.
15. **Offline resilience**: After loading rates, switching the browser to offline mode and reloading the page still displays the converter with cached rates and a staleness warning.
16. **Error state**: When the rate API is unreachable, the UI displays an error message instead of silently failing or showing a blank screen.
17. **Invalid input handling**: Entering non-numeric text (e.g., "abc") in the amount field is either prevented or shows a validation message, and does not produce a NaN result.
18. **Decimal input**: Entering "99.99" produces a correctly formatted conversion result (not truncated or rounded incorrectly).
