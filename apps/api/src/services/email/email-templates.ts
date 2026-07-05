/**
 * Email Templates
 * HTML templates for different email types
 */

export interface InvoiceEmailData {
	invoiceNumber: string;
	customerName: string;
	total: string;
	dueDate: string;
	items: Array<{
		description: string;
		quantity: number;
		unitPrice: string;
		total: string;
	}>;
}

export interface PaymentConfirmationData {
	invoiceNumber: string;
	customerName: string;
	amount: string;
	paymentDate: string;
	paymentMethod: string;
	remaining: string;
}

export interface PaymentReminderData {
	invoiceNumber: string;
	customerName: string;
	total: string;
	dueDate: string;
	daysOverdue: number;
}

export interface OverdueNoticeData {
	invoiceNumber: string;
	customerName: string;
	total: string;
	dueDate: string;
	daysOverdue: number;
}

/**
 * Common email styles
 */
const commonStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
  .content { padding: 30px; }
  .greeting { font-size: 18px; margin-bottom: 20px; }
  .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
`;

/**
 * Generate invoice email HTML
 */
export function generateInvoiceEmail(data: InvoiceEmailData): string {
	return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Factura ${data.invoiceNumber}</title>
  <style>
    ${commonStyles}
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
    .invoice-info { background: #f8f9fa; border-radius: 6px; padding: 20px; margin: 20px 0; }
    .invoice-info p { margin: 8px 0; }
    .invoice-info strong { color: #667eea; }
    .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .items-table th { background: #667eea; color: white; padding: 12px; text-align: left; }
    .items-table td { padding: 12px; border-bottom: 1px solid #e0e0e0; }
    .total { text-align: right; font-size: 20px; font-weight: 700; color: #667eea; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🧾 Nueva Factura</h1>
    </div>
    <div class="content">
      <p class="greeting">Estimado/a ${data.customerName},</p>
      <p>Le enviamos su factura electrónica. Adjunto encontrará el documento en formato PDF.</p>
      
      <div class="invoice-info">
        <p><strong>Número de Factura:</strong> ${data.invoiceNumber}</p>
        <p><strong>Fecha de Vencimiento:</strong> ${new Date(data.dueDate).toLocaleDateString("es-PE")}</p>
        <p><strong>Total a Pagar:</strong> S/ ${data.total}</p>
      </div>

      <h3>Detalle de Items:</h3>
      <table class="items-table">
        <thead>
          <tr>
            <th>Descripción</th>
            <th>Cant.</th>
            <th>P. Unit.</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${data.items
						.map(
							(item) => `
            <tr>
              <td>${item.description}</td>
              <td>${item.quantity}</td>
              <td>S/ ${item.unitPrice}</td>
              <td>S/ ${item.total}</td>
            </tr>
          `,
						)
						.join("")}
        </tbody>
      </table>

      <div class="total">
        Total: S/ ${data.total}
      </div>

      <p>Si tiene alguna pregunta sobre esta factura, no dude en contactarnos.</p>
    </div>
    <div class="footer">
      <p>Este es un correo automático generado por ARKELYTHEX</p>
      <p>© ${new Date().getFullYear()} ARKELYTHEX. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate payment confirmation email HTML
 */
export function generatePaymentConfirmationEmail(
	data: PaymentConfirmationData,
): string {
	return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación de Pago</title>
  <style>
    ${commonStyles}
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
    .success-icon { font-size: 64px; text-align: center; margin: 20px 0; }
    .payment-info { background: #f0fdf4; border: 2px solid #10b981; border-radius: 6px; padding: 20px; margin: 20px 0; }
    .payment-info p { margin: 8px 0; }
    .payment-info strong { color: #059669; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Pago Recibido</h1>
    </div>
    <div class="content">
      <div class="success-icon">🎉</div>
      <p class="greeting">Estimado/a ${data.customerName},</p>
      <p>Hemos recibido su pago correctamente. A continuación los detalles:</p>
      
      <div class="payment-info">
        <p><strong>Factura:</strong> ${data.invoiceNumber}</p>
        <p><strong>Monto Pagado:</strong> S/ ${data.amount}</p>
        <p><strong>Fecha de Pago:</strong> ${new Date(data.paymentDate).toLocaleDateString("es-PE")}</p>
        <p><strong>Método de Pago:</strong> ${data.paymentMethod}</p>
        <p><strong>Saldo Pendiente:</strong> S/ ${data.remaining}</p>
      </div>

      <p>Gracias por su pago puntual. Si tiene alguna pregunta, no dude en contactarnos.</p>
    </div>
    <div class="footer">
      <p>Este es un correo automático generado por ARKELYTHEX</p>
      <p>© ${new Date().getFullYear()} ARKELYTHEX. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate payment reminder email HTML
 */
export function generatePaymentReminderEmail(
	data: PaymentReminderData,
): string {
	return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recordatorio de Pago</title>
  <style>
    ${commonStyles}
    .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
    .reminder-info { background: #fffbeb; border: 2px solid #f59e0b; border-radius: 6px; padding: 20px; margin: 20px 0; }
    .reminder-info p { margin: 8px 0; }
    .reminder-info strong { color: #d97706; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ Recordatorio de Pago</h1>
    </div>
    <div class="content">
      <p class="greeting">Estimado/a ${data.customerName},</p>
      <p>Le recordamos que tiene una factura pendiente de pago.</p>
      
      <div class="reminder-info">
        <p><strong>Factura:</strong> ${data.invoiceNumber}</p>
        <p><strong>Total:</strong> S/ ${data.total}</p>
        <p><strong>Fecha de Vencimiento:</strong> ${new Date(data.dueDate).toLocaleDateString("es-PE")}</p>
        ${data.daysOverdue > 0 ? `<p><strong>Días de Atraso:</strong> ${data.daysOverdue} días</p>` : ""}
      </div>

      <p>Le agradeceremos realizar el pago a la brevedad posible para evitar cargos adicionales.</p>
    </div>
    <div class="footer">
      <p>Este es un correo automático generado por ARKELYTHEX</p>
      <p>© ${new Date().getFullYear()} ARKELYTHEX. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate overdue notice email HTML
 */
export function generateOverdueNoticeEmail(data: OverdueNoticeData): string {
	return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Factura Vencida</title>
  <style>
    ${commonStyles}
    .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
    .overdue-info { background: #fef2f2; border: 2px solid #ef4444; border-radius: 6px; padding: 20px; margin: 20px 0; }
    .overdue-info p { margin: 8px 0; }
    .overdue-info strong { color: #dc2626; }
    .urgent { background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Factura Vencida</h1>
    </div>
    <div class="content">
      <p class="greeting">Estimado/a ${data.customerName},</p>
      <p>Le informamos que la siguiente factura se encuentra vencida:</p>
      
      <div class="overdue-info">
        <p><strong>Factura:</strong> ${data.invoiceNumber}</p>
        <p><strong>Total:</strong> S/ ${data.total}</p>
        <p><strong>Fecha de Vencimiento:</strong> ${new Date(data.dueDate).toLocaleDateString("es-PE")}</p>
        <p><strong>Días de Atraso:</strong> ${data.daysOverdue} días</p>
      </div>

      <div class="urgent">
        <strong>⚠️ Acción Requerida:</strong> Por favor, regularice el pago a la brevedad para evitar la suspensión del servicio y posibles acciones legales.
      </div>

      <p>Si ya realizó el pago, por favor ignore este mensaje y envíenos el comprobante.</p>
    </div>
    <div class="footer">
      <p>Este es un correo automático generado por ARKELYTHEX</p>
      <p>© ${new Date().getFullYear()} ARKELYTHEX. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
  `;
}
