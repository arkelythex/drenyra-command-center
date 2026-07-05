import { AUTH_EMAIL_STYLES, getEmailFooter } from "./email-styles";

/**
 * Email Verification Template
 */

export interface VerificationEmailData {
	userName: string;
	verificationUrl: string;
	expiresIn?: string;
}

export function generateVerificationEmail(data: VerificationEmailData): string {
	return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verifica tu email - ARKELYTHEX</title>
  <style>${AUTH_EMAIL_STYLES}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🔐</div>
      <h1>Verifica tu Email</h1>
      <p class="subtitle">ARKELYTHEX - Sistema de Gobernanza Financiera</p>
    </div>
    <div class="content">
      <p class="greeting">¡Hola ${data.userName}!</p>
      <p>Gracias por registrarte en <strong>ARKELYTHEX</strong>. Estás a un paso de acceder a tu plataforma de gobernanza financiera.</p>

      <p>Para completar tu registro, por favor verifica tu dirección de email haciendo clic en el botón de abajo:</p>

      <center>
        <a href="${data.verificationUrl}" class="button">✅ Verificar Email</a>
      </center>

      <div class="info-box">
        <p><strong>🔗 Link de verificación:</strong></p>
        <p style="word-break: break-all; font-size: 12px;">${data.verificationUrl}</p>
      </div>

      ${
				data.expiresIn
					? `
      <div class="warning">
        ⏰ <strong>Importante:</strong> Este enlace expirará en <strong>${data.expiresIn}</strong>. Si el enlace expira, podrás solicitar uno nuevo desde la página de login.
      </div>
      `
					: ""
			}

      <p style="margin-top: 30px;">Si no creaste una cuenta en ARKELYTHEX, puedes ignorar este email de forma segura.</p>
    </div>
    ${getEmailFooter()}
  </div>
</body>
</html>
  `;
}
