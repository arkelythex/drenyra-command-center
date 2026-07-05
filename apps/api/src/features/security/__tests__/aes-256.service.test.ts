import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { decryptJsonValue, encryptJsonValue } from '../aes-256.service';

describe('aes-256.service', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv, DRENYRA_AES256_KEY: 'drenyra-test-key-for-aes-256-gcm' };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('encrypts and decrypts tool args with context-bound AAD', () => {
    const payload = { amount: 118, igv: 18, providerRuc: '20123456789' };
    const encrypted = encryptJsonValue(payload, { runId: 'run-1', toolCallId: 'tool-1' });
    const decrypted = decryptJsonValue(encrypted, { runId: 'run-1', toolCallId: 'tool-1' });

    expect(encrypted).not.toEqual(payload);
    expect(decrypted).toEqual(payload);
  });

  it('returns original payload when encryption key is missing', () => {
    delete process.env.DRENYRA_AES256_KEY;
    const payload = { amount: 100 };

    const encrypted = encryptJsonValue(payload, { runId: 'run-2', toolCallId: 'tool-2' });
    const decrypted = decryptJsonValue(encrypted, { runId: 'run-2', toolCallId: 'tool-2' });

    expect(encrypted).toEqual(payload);
    expect(decrypted).toEqual(payload);
  });

  it('redacts payload when decryption context does not match', () => {
    const payload = { amount: 1000 };
    const encrypted = encryptJsonValue(payload, { runId: 'run-3', toolCallId: 'tool-3' });
    const decrypted = decryptJsonValue(encrypted, { runId: 'run-x', toolCallId: 'tool-y' });

    expect(decrypted).toEqual({
      redacted: true,
      reason: 'encrypted_payload_unavailable',
    });
  });
});
