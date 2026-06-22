import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { useCpeErrorCatalogMock, useCpeValidationMock, mutateMock, refetchMock } = vi.hoisted(() => ({
  useCpeErrorCatalogMock: vi.fn(),
  useCpeValidationMock: vi.fn(),
  mutateMock: vi.fn(),
  refetchMock: vi.fn(),
}));

vi.mock('../../../hooks/useCpeErrorCatalog', () => ({
  useCpeErrorCatalog: useCpeErrorCatalogMock,
}));

vi.mock('../../../hooks/useCpeValidation', () => ({
  useCpeValidation: useCpeValidationMock,
}));

import { CpeValidatorTab } from '../CpeValidatorTab';

describe('CpeValidatorTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useCpeErrorCatalogMock.mockReturnValue({
      data: [
        {
          state: 'RECHAZADO',
          code: '2320',
          incidentCategory: 'SUNAT_REJECTED',
          severity: 'high',
          summary: 'SUNAT rechazo el comprobante.',
          defaultErrorMessage: 'RUC no valido',
          supportMessage: 'Corrige el RUC emisor.',
          recommendedActions: ['Verifica el RUC'],
        },
      ],
      isLoading: false,
      isError: false,
      refetch: refetchMock,
    });

    useCpeValidationMock.mockReturnValue({
      data: null,
      isPending: false,
      mutate: mutateMock,
      reset: vi.fn(),
    });
  });

  it('renders validation controls and full CPE table', () => {
    render(<CpeValidatorTab />);

    expect(screen.getByText('Validación de Comprobantes')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /filtros/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /validar seleccion/i })).toHaveLength(2);

    // 1 header row + 15 data rows
    expect(screen.getAllByRole('row')).toHaveLength(16);
    expect(screen.getAllByText('Sujeto a 10%')).toHaveLength(4);
  });

  it('validates the currently selected row when the action is triggered', () => {
    render(<CpeValidatorTab />);

    fireEvent.click(screen.getByText('SERVICIOS LOGISTICOS'));
    fireEvent.click(screen.getAllByRole('button', { name: /validar seleccion/i })[0]);

    expect(mutateMock).toHaveBeenCalledTimes(1);
    expect(mutateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'c3',
        provider: 'SERVICIOS LOGISTICOS',
        sunatCode: '2320',
      }),
    );
  });
});
