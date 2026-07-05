import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runtimeConfig } from '../runtime-config';
import { captureError, trackEvent, trackPageView } from '../monitoring';

// Mock @sentry/react
vi.mock('@sentry/react', () => ({
  captureException: vi.fn(),
  init: vi.fn(),
  reactErrorHandler: vi.fn(() => vi.fn()),
  replayIntegration: vi.fn(() => ({ name: 'Replay' })),
  tanstackRouterBrowserTracingIntegration: vi.fn(() => ({ name: 'TanStackRouter' })),
}));

describe('monitoring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(runtimeConfig, {
      monitoringEnabled: true,
      monitoringEndpoint: '',
      webVitalsEnabled: false,
      sentryDsn: 'https://public@example.com/1',
      sentryEnvironment: 'test',
      sentryTracesSampleRate: 0.2,
      sentryReplaysSessionSampleRate: 0.1,
      sentryReplaysOnErrorSampleRate: 1,
      sentryScriptUrl: '',
      plausibleDomain: 'drenyra.test',
      plausibleApiHost: 'https://plausible.io',
    });
    window.plausible = vi.fn();
  });

  it('forwards captured exceptions to Sentry when enabled', async () => {
    const { captureException } = await import('@sentry/react');
    const err = new Error('boom');

    captureError(err, { source: 'test-case' });

    expect(captureException).toHaveBeenCalledWith(
      err,
      expect.objectContaining({
        extra: { source: 'test-case' },
      }),
    );
  });

  it('sends analytics events to plausible', () => {
    trackEvent('dashboard_opened', { section: 'home', count: 2 });
    trackPageView('/dashboard');

    expect(window.plausible).toHaveBeenCalledWith(
      'dashboard_opened',
      expect.objectContaining({
        props: expect.objectContaining({
          section: 'home',
          count: 2,
        }),
      }),
    );
    expect(window.plausible).toHaveBeenCalledWith(
      'pageview',
      expect.objectContaining({
        props: expect.objectContaining({
          path: '/dashboard',
        }),
      }),
    );
  });

  it('is a no-op when monitoring is disabled', () => {
    runtimeConfig.monitoringEnabled = false;

    captureError(new Error('no-op'));
    trackEvent('noop');
    trackPageView('/noop');

    expect(window.plausible).not.toHaveBeenCalled();
  });
});
