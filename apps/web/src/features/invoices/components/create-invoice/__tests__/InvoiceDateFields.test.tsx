import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { InvoiceDateFields } from '../InvoiceDateFields';

describe('InvoiceDateFields', () => {
  it('keeps fiscal dates as yyyy-MM-dd strings through native date inputs', () => {
    const onIssueDateChange = vi.fn();
    const onDueDateChange = vi.fn();

    render(
      <InvoiceDateFields
        dueDate="2026-03-02"
        issueDate="2026-02-01"
        onDueDateChange={onDueDateChange}
        onIssueDateChange={onIssueDateChange}
      />,
    );

    expect(screen.getByLabelText('Fecha de emisión')).toHaveValue('2026-02-01');
    expect(screen.getByLabelText('Fecha de vencimiento')).toHaveValue('2026-03-02');

    fireEvent.change(screen.getByLabelText('Fecha de emisión'), {
      target: { value: '2026-02-10' },
    });
    fireEvent.change(screen.getByLabelText('Fecha de vencimiento'), {
      target: { value: '2026-03-15' },
    });

    expect(onIssueDateChange).toHaveBeenCalledWith('2026-02-10');
    expect(onDueDateChange).toHaveBeenCalledWith('2026-03-15');
  });
});
