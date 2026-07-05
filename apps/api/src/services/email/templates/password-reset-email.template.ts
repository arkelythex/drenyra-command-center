import { AUTH_EMAIL_STYLES, getEmailFooter } from "./email-styles";

/**
 * Password Reset Email Template
 */

export interface PasswordResetEmailData {
	userName: string;
	resetUrl: string;
	expiresIn?: string;
}

export function generatePasswordResetEmail(
	data: PasswordResetEmailData,
): string {
	return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Restablecer Contraseña - ARKELYTHEX</title>
  <style>${AUTH_EMAIL_STYLES}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🔑</div>
      <h1>Restablecer Contraseña</h1>
      <p class="subtitle">ARKELYTHEX - Sistema de Gobernanza Financiera</p>
    </div>
    <div class="content">
      <p class="greeting">Hola ${data.userName},</p>
      <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>ARKELYTHEX</strong>.</p>

      <p>Si solicitaste este cambio, haz clic en el botón de abajo para crear una nueva contraseña:</p>

      <center>
        <a href="${data.resetUrl}" class="button">🔐 Restablecer Contraseña</a>
      </center>

      <div class="info-box">
        <p><strong>🔗 Link de restablecimiento:</strong></p>
        <p style="word-break: break-all; font-size: 12px;">${data.resetUrl}</p>
      </div>

      ${
				data.expiresIn
					? `
      <div class="warning">
        ⏰ <strong>Importante:</strong> Este enlace expirará en <strong>${data.expiresIn}</strong>. Si el enlace expira, deberás solicitar un nuevo restablecimiento.
      </div>
      `
					: ""
			}

      <div class="warning" style="margin-top: 30px; background: rgba(239, 68, 68, 0.1); border-left-color: #ef4444; color: #fecaca;">
        🛡️ <strong>¿No solicitaste este cambio?</strong><br>
        Si no solicitaste restablecer tu contraseña, ignora este email y tu contraseña permanecerá sin cambios. Tu cuenta está segura.
      </div>
    </div>
    ${getEmailFooter()}
  </div>
</body>
</html>
  `;
}
