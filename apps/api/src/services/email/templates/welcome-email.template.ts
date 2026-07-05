import { AUTH_EMAIL_STYLES, getEmailFooter } from "./email-styles";

/**
 * Welcome Email Template
 */

export interface WelcomeEmailData {
	userName: string;
	ruc: string;
	loginUrl: string;
}

export function generateWelcomeEmail(data: WelcomeEmailData): string {
	return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenido a ARKELYTHEX</title>
  <style>${AUTH_EMAIL_STYLES}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🎉</div>
      <h1>¡Bienvenido a ARKELYTHEX!</h1>
      <p class="subtitle">Tu cuenta ha sido activada exitosamente</p>
    </div>
    <div class="content">
      <p class="greeting">¡Hola ${data.userName}!</p>
      <p>Tu cuenta en <strong>ARKELYTHEX</strong> ha sido verificada y está lista para usar. Ahora tienes acceso completo a nuestra plataforma de gobernanza financiera.</p>

      <div class="info-box">
        <p><strong>📋 Información de tu cuenta:</strong></p>
        <p>👤 Usuario: <span class="code">${data.userName}</span></p>
        <p>🏢 RUC Empresarial: <span class="code">${data.ruc}</span></p>
      </div>

      <p><strong>¿Qué puedes hacer ahora?</strong></p>
      <ul style="color: #cbd5e1; line-height: 1.8;">
        <li>📊 Ver análisis financieros en tiempo real</li>
        <li>🧾 Gestionar facturas electrónicas SUNAT</li>
        <li>💰 Seguimiento de flujo de caja</li>
        <li>🤖 Usar asistente AI para consultas tributarias</li>
        <li>📈 Generar reportes de cumplimiento</li>
      </ul>

      <center style="margin-top: 30px;">
        <a href="${data.loginUrl}" class="button">🚀 Ir al Dashboard</a>
      </center>

      <div class="info-box" style="margin-top: 30px; background: rgba(34, 197, 94, 0.1); border-color: rgba(34, 197, 94, 0.3);">
        <p><strong>✅ SUNAT 2026 Compliance</strong></p>
        <p style="font-size: 14px;">Tu cuenta cumple con todos los requisitos de SUNAT para facturación electrónica y registro de operaciones.</p>
      </div>

      <p style="margin-top: 30px;">Si tienes alguna pregunta, nuestro equipo de soporte está aquí para ayudarte.</p>
    </div>
    ${getEmailFooter()}
  </div>
</body>
</html>
  `;
}
