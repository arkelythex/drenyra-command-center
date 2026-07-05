import { describe, expect, it } from 'vitest';
import { resolveCorsOrigins } from '../cors';

describe('resolveCorsOrigins', () => {
  it('uses explicit allowlist from env', () => {
    const origins = resolveCorsOrigins({
      NODE_ENV: 'production',
      CORS_ALLOWED_ORIGINS: 'https://app.drenyrafounders.com, https://admin.drenyrafounders.com',
    });

    expect(origins).toEqual([
      'https://app.drenyrafounders.com',
      'https://admin.drenyrafounders.com',
    ]);
  });

  it('deduplicates repeated env origins', () => {
    const origins = resolveCorsOrigins({
      NODE_ENV: 'production',
      CORS_ALLOWED_ORIGINS: 'https://app.drenyrafounders.com,https://app.drenyrafounders.com',
    });

    expect(origins).toEqual(['https://app.drenyrafounders.com']);
  });

  it('supports legacy ALLOWED_ORIGINS fallback', () => {
    const origins = resolveCorsOrigins({
      NODE_ENV: 'production',
      CORS_ALLOWED_ORIGINS: '',
      ALLOWED_ORIGINS: 'https://legacy.drenyrafounders.com',
    });

    expect(origins).toEqual(['https://legacy.drenyrafounders.com']);
  });

  it('uses localhost defaults in non-production when env is unset', () => {
    const origins = resolveCorsOrigins({
      NODE_ENV: 'development',
      CORS_ALLOWED_ORIGINS: '',
    });

    expect(origins).toContain('http://localhost:5173');
    expect(origins).toContain('http://127.0.0.1:5173');
  });

  it('blocks by default in production when env is unset', () => {
    const origins = resolveCorsOrigins({
      NODE_ENV: 'production',
      CORS_ALLOWED_ORIGINS: '',
    });

    expect(origins).toEqual([]);
  });
});
