import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Elysia } from 'elysia';
import { bankingProvidersRoutes } from '../../api/routes';
import { ConnectBankCommand } from '../../application/commands/connect-bank.command';
import { GetBankAccountsQuery } from '../../application/queries/get-bank-accounts.query';
import { GetBankMovementsQuery } from '../../application/queries/get-bank-movements.query';
import { PrometeoService } from '../../infrastructure/prometeo.service';

describe('banking-providers routes', () => {
  const originalApiKey = process.env.PROMETEO_API_KEY;
  const app = new Elysia().use(bankingProvidersRoutes);

  beforeEach(() => {
    process.env.PROMETEO_API_KEY = 'test-prometeo-key';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env.PROMETEO_API_KEY = originalApiKey;
  });

  it('connects bank and returns session data', async () => {
    vi.spyOn(ConnectBankCommand.prototype, 'execute').mockResolvedValue({
      sessionKey: 'pmt_sk_123',
      provider: 'interbank_pe',
      expiresIn: 300,
    });

    const response = await app.handle(
      new Request('http://localhost/api/banking-providers/connect', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          provider: 'interbank_pe',
          username: '4557000000000001',
          password: '123456',
        }),
      }),
    );

    expect(response.status).toBe(201);
    const payload = await response.json();
    expect(payload).toMatchObject({
      success: true,
      data: {
        sessionKey: 'pmt_sk_123',
        provider: 'interbank_pe',
        expiresIn: 300,
      },
    });
  });

  it('validates required BCP personal document fields', async () => {
    const response = await app.handle(
      new Request('http://localhost/api/banking-providers/connect', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          provider: 'bcp_pers_pe',
          username: '4557000000000001',
          password: '123456',
        }),
      }),
    );

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload).toMatchObject({
      success: false,
      code: 'VALIDATION_ERROR',
    });
  });

  it('gets accounts using session key header', async () => {
    vi.spyOn(GetBankAccountsQuery.prototype, 'execute').mockResolvedValue([
      {
        id: 'acc_1',
        name: 'Cuenta Corriente',
        number: '123',
        branch: '001',
        currency: 'PEN',
        balance: 100,
        type: 'CHECKING',
        provider: 'interbank_pe',
      },
    ]);

    const response = await app.handle(
      new Request('http://localhost/api/banking-providers/accounts?provider=interbank_pe', {
        method: 'GET',
        headers: { 'x-prometeo-session-key': 'pmt_sk_header' },
      }),
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload).toMatchObject({
      success: true,
      data: {
        accounts: [
          {
            id: 'acc_1',
            provider: 'interbank_pe',
          },
        ],
      },
    });
  });

  it('returns validation error when session key is missing', async () => {
    const response = await app.handle(
      new Request('http://localhost/api/banking-providers/accounts?provider=interbank_pe', {
        method: 'GET',
      }),
    );

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload).toEqual({
      success: false,
      error: 'Session key requerida',
      code: 'SESSION_KEY_REQUIRED',
    });
  });

  it('returns canonical envelope for query schema validation errors', async () => {
    const response = await app.handle(
      new Request('http://localhost/api/banking-providers/accounts?provider=invalid_provider', {
        method: 'GET',
      }),
    );

    expect(response.status).toBe(422);
    const payload = await response.json();
    expect(payload).toEqual({
      success: false,
      error: 'Invalid banking providers request',
      code: 'VALIDATION_ERROR',
    });
  });

  it('gets movements using session key header', async () => {
    vi.spyOn(GetBankMovementsQuery.prototype, 'execute').mockResolvedValue([
      {
        id: 'mov_1',
        date: '2026-02-01',
        description: 'Transferencia',
        reference: 'OP-1',
        debit: null,
        credit: 150,
        balance: 150,
        currency: 'PEN',
        type: 'CREDIT',
        provider: 'interbank_pe',
      },
    ]);

    const response = await app.handle(
      new Request(
        'http://localhost/api/banking-providers/movements?provider=interbank_pe&accountId=acc_1',
        {
          method: 'GET',
          headers: { 'x-prometeo-session-key': 'pmt_sk_header' },
        },
      ),
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload).toMatchObject({
      success: true,
      data: {
        movements: [{ id: 'mov_1', type: 'CREDIT' }],
      },
    });
  });

  it('disconnect endpoint tolerates provider logout errors', async () => {
    vi.spyOn(PrometeoService.prototype, 'logout').mockRejectedValue(
      new Error('session expired'),
    );

    const response = await app.handle(
      new Request('http://localhost/api/banking-providers/disconnect', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionKey: 'pmt_sk_123' }),
      }),
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload).toEqual({
      success: true,
      data: { disconnected: true },
    });
  });
});
