import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const get = vi.fn();
vi.mock('@/lib/zodiosClients', () => ({ customerApi: { customerMoney: { get: (...a: unknown[]) => get(...a) } } }));

import { TaxInvoiceSheet } from './TaxInvoiceSheet';

const invoice = {
  invoiceNumber: 'FD/2627/0000123', issuedAt: '2026-09-24T20:15:00', orderId: 'abcdef12-0000-0000-0000-000000000000',
  supplier: { legalName: 'Paradise Food Court Pvt Ltd', tradeName: 'Paradise Koramangala', gstin: '29ABCDE1234F1Z5', fssaiLicenseNumber: '11224333000123' },
  operator: null,
  customerName: 'Asha', deliveryAddress: '12 MG Road',
  lines: [{ description: 'Chicken Biryani', sac: '996331', quantity: 2, unitPrice: 290, amount: 580 }],
  taxableValue: 580, cgstRatePercent: 2.5, cgstAmount: 14.5, sgstRatePercent: 2.5, sgstAmount: 14.5,
  deliveryFee: 30, platformFee: 5, total: 644, paymentMethod: 'UPI',
};

describe('TaxInvoiceSheet', () => {
  beforeEach(() => get.mockReset());

  it('shows the numbered invoice with the supplier, lines and tax, and prints it', async () => {
    get.mockResolvedValue(invoice);
    const print = vi.spyOn(window, 'print').mockImplementation(() => {});
    render(<TaxInvoiceSheet orderId="o-1" open onClose={() => {}} />);

    expect(await screen.findByText('FD/2627/0000123')).toBeInTheDocument();
    expect(get).toHaveBeenCalledWith('/api/v1/money/customer/orders/:orderId/invoice', { params: { orderId: 'o-1' } });
    expect(screen.getByText('29ABCDE1234F1Z5')).toBeInTheDocument();
    expect(screen.getByText('Chicken Biryani')).toBeInTheDocument();
    expect(screen.getByText('CGST @ 2.5%')).toBeInTheDocument();
    expect(screen.queryByText('E-COMMERCE OPERATOR')).not.toBeInTheDocument();
    expect(screen.getByTestId('tax-invoice')).toHaveAttribute('data-print-root');

    fireEvent.click(screen.getByRole('button', { name: /Print or save as PDF/ }));
    expect(print).toHaveBeenCalled();
  });

  it('says why when the order is not delivered yet, and can retry', async () => {
    get.mockRejectedValueOnce({ response: { status: 409 } }).mockResolvedValueOnce(invoice);
    render(<TaxInvoiceSheet orderId="o-1" open onClose={() => {}} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('once the order is delivered');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('FD/2627/0000123')).toBeInTheDocument();
  });

  it('asks for nothing while closed', () => {
    render(<TaxInvoiceSheet orderId="o-1" open={false} onClose={() => {}} />);
    expect(get).not.toHaveBeenCalled();
  });
});
