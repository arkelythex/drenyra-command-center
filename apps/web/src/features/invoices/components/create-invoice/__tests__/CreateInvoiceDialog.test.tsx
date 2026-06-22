import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { CreateInvoicePayload } from '../types';

vi.mock('../InvoiceForm', () => ({
  InvoiceForm: ({
    onCancel,
    onSubmit,
    companyId,
  }: {
    onCancel: () => void;
    onSubmit: (payload: CreateInvoicePayload) => Promise<void>;
    companyId: string;
  }) => (
    <div data-testid="invoice-form-mock">
      <span>{companyId}</span>
      <button type="button" onClick={() => onCancel()}>
        Cancel From Mock
      </button>
      <button
        type="button"
        onClick={() => {
          void onSubmit({
            companyId,
            customerId: 'customer-1',
            series: 'F001',
            issueDate: '2026-03-21',
            dueDate: '2026-03-31',
            currency: 'PEN',
            notes: 'mock-form',
            items: [
              {
                description: 'Servicio demo',
                quantity: '1',
                unitPrice: '100.00',
                taxType: 'GRAVADO',
              },
            ],
          });
        }}
      >
        Submit From Mock
      </button>
    </div>
  ),
}));

import { CreateInvoiceDialog } from '../CreateInvoiceDialog';

describe('CreateInvoiceDialog', () => {
  it('renders title and passes companyId to InvoiceForm when open', async () => {
    const onOpenChange = vi.fn();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <CreateInvoiceDialog
        open
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
        companyId="company-xyz"
      />,
    );

    expect(screen.getByText('NUEVA FACTURA')).toBeInTheDocument();
    expect(screen.getByText('Módulo de Facturación')).toBeInTheDocument();
    expect(await screen.findByTestId('invoice-form-mock')).toBeInTheDocument();
    expect(screen.getByText('company-xyz')).toBeInTheDocument();
  });

  it('delegates cancel to onOpenChange(false)', async () => {
    const onOpenChange = vi.fn();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <CreateInvoiceDialog
        open
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
        companyId="company-xyz"
      />,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Cancel From Mock' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('forwards submit payload to parent onSubmit', async () => {
    const onOpenChange = vi.fn();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <CreateInvoiceDialog
        open
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
        companyId="company-xyz"
      />,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Submit From Mock' }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: 'company-xyz',
        currency: 'PEN',
        notes: 'mock-form',
        series: 'F001',
      }),
    );
  });
});
