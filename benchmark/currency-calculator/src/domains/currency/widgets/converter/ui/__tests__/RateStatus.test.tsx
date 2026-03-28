import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RateStatus } from '../RateStatus';

describe('RateStatus', () => {
  test('displays pre-formatted last updated time when provided', () => {
    render(
      <RateStatus
        lastUpdatedDisplay="12:00:00 PM"
        isStale={false}
        isLoading={false}
        error={null}
        onRefresh={() => {}}
      />,
    );
    expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    expect(screen.getByText(/12:00:00 PM/)).toBeInTheDocument();
  });

  test('shows staleness warning when rates are stale', () => {
    render(
      <RateStatus
        lastUpdatedDisplay="12:00:00 PM"
        isStale={true}
        isLoading={false}
        error={null}
        onRefresh={() => {}}
      />,
    );
    expect(screen.getByText(/rates may be outdated/)).toBeInTheDocument();
  });

  test('shows cached data message when error occurred but data exists', () => {
    render(
      <RateStatus
        lastUpdatedDisplay="12:00:00 PM"
        isStale={true}
        isLoading={false}
        error="Network error"
        onRefresh={() => {}}
      />,
    );
    expect(screen.getByText(/Using cached data/)).toBeInTheDocument();
  });

  test('calls onRefresh when refresh button is clicked', async () => {
    const handleRefresh = vi.fn();
    render(
      <RateStatus
        lastUpdatedDisplay=""
        isStale={false}
        isLoading={false}
        error={null}
        onRefresh={handleRefresh}
      />,
    );
    const user = userEvent.setup();
    await user.click(screen.getByText('Refresh Rates'));
    expect(handleRefresh).toHaveBeenCalledTimes(1);
  });

  test('disables refresh button when loading', () => {
    render(
      <RateStatus
        lastUpdatedDisplay=""
        isStale={false}
        isLoading={true}
        error={null}
        onRefresh={() => {}}
      />,
    );
    expect(screen.getByText('Refreshing...')).toBeDisabled();
  });

  test('does not show last updated section when display string is empty', () => {
    render(
      <RateStatus
        lastUpdatedDisplay=""
        isStale={false}
        isLoading={false}
        error={null}
        onRefresh={() => {}}
      />,
    );
    expect(screen.queryByText(/Last updated:/)).not.toBeInTheDocument();
  });
});
