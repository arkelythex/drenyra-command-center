import { beforeEach, describe, expect, it, vi } from 'vitest';

const toDataURLMock = vi.fn();
const captureErrorMock = vi.fn();

vi.mock('qrcode', () => ({
  default: {
    toDataURL: toDataURLMock,
  },
}));

vi.mock('@/lib/monitoring', () => ({
  captureError: captureErrorMock,
}));

describe('PDFService.generateQRCode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns generated data url', async () => {
    toDataURLMock.mockResolvedValue('data:image/png;base64,abc');

    const { PDFService } = await import('../pdf.service');
    const result = await PDFService.generateQRCode({
      series: 'F001',
      number: '00000001',
      tax: '18.00',
      total: '118.00',
      issueDate: '2026-03-21',
      customerTaxId: '20100070970',
    } as never);

    expect(result).toBe('data:image/png;base64,abc');
    expect(toDataURLMock).toHaveBeenCalledOnce();
  });

  it('captures error and returns empty string on failure', async () => {
    toDataURLMock.mockRejectedValue(new Error('qr failed'));

    const { PDFService } = await import('../pdf.service');
    const result = await PDFService.generateQRCode({
      series: 'F001',
      number: '00000002',
      tax: '18.00',
      total: '118.00',
      issueDate: '2026-03-21',
      customerTaxId: '20100070970',
    } as never);

    expect(result).toBe('');
    expect(captureErrorMock).toHaveBeenCalledOnce();
  });
});
