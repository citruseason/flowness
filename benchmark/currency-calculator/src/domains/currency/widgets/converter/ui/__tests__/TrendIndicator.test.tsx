import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TrendIndicator } from '../TrendIndicator';

describe('TrendIndicator', () => {
  test('renders up arrow with pre-formatted percentage for up trend', () => {
    render(
      <TrendIndicator
        direction="up"
        displayPercentage="2.50%"
      />,
    );
    const indicator = screen.getByTestId('trend-indicator');
    expect(indicator).toHaveTextContent('2.50%');
    expect(indicator).toHaveClass('trend-up');
  });

  test('renders down arrow with pre-formatted percentage for down trend', () => {
    render(
      <TrendIndicator
        direction="down"
        displayPercentage="1.25%"
      />,
    );
    const indicator = screen.getByTestId('trend-indicator');
    expect(indicator).toHaveTextContent('1.25%');
    expect(indicator).toHaveClass('trend-down');
  });

  test('renders stable indicator for stable trend', () => {
    render(
      <TrendIndicator
        direction="stable"
        displayPercentage="0.00%"
      />,
    );
    const indicator = screen.getByTestId('trend-indicator');
    expect(indicator).toHaveClass('trend-stable');
  });

  test('does not perform any data transformation - renders props directly', () => {
    render(
      <TrendIndicator
        direction="up"
        displayPercentage="3.14%"
      />,
    );
    const indicator = screen.getByTestId('trend-indicator');
    // The exact display percentage is passed in, no formatting in View
    expect(indicator).toHaveTextContent('3.14%');
  });
});
