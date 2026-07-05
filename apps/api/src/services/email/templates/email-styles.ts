/**
 * Common Email Styles
 * Glass & Steel design system for auth emails
 */

export const AUTH_EMAIL_STYLES = `
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: #e2e8f0;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    margin: 0;
    padding: 0;
  }
  .container {
    max-width: 600px;
    margin: 40px auto;
    background: rgba(15, 23, 42, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  }
  .header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 40px 30px;
    text-align: center;
  }
  .header h1 {
    margin: 0;
    font-size: 32px;
    font-weight: 700;
    letter-spacing: -0.5px;
  }
  .header .subtitle {
    margin: 8px 0 0 0;
    font-size: 14px;
    opacity: 0.9;
  }
  .content {
    padding: 40px 30px;
  }
  .greeting {
    font-size: 18px;
    margin-bottom: 20px;
    color: #f1f5f9;
  }
  .button {
    display: inline-block;
    padding: 16px 32px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 600;
    margin: 20px 0;
    font-size: 16px;
    transition: transform 0.2s;
  }
  .button:hover {
    transform: translateY(-2px);
  }
  .info-box {
    background: rgba(100, 126, 234, 0.1);
    border: 1px solid rgba(100, 126, 234, 0.3);
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
    color: #cbd5e1;
  }
  .info-box strong {
    color: #a5b4fc;
  }
  .warning {
    background: rgba(251, 191, 36, 0.1);
    border-left: 4px solid #fbbf24;
    padding: 15px;
    margin: 20px 0;
    border-radius: 4px;
    color: #fef3c7;
  }
  .footer {
    background: rgba(15, 23, 42, 0.8);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding: 30px;
    text-align: center;
    color: #94a3b8;
    font-size: 14px;
  }
  .footer a {
    color: #a5b4fc;
    text-decoration: none;
  }
  .code {
    font-family: 'Courier New', monospace;
    background: rgba(255, 255, 255, 0.05);
    padding: 2px 6px;
    border-radius: 4px;
    color: #a5b4fc;
  }
  .logo {
    font-size: 48px;
    margin-bottom: 10px;
  }
`;

export function getEmailFooter(): string {
  return `
    <div class="footer">
      <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
      <p style="margin-top: 15px;">
        <a href="https://drenyrafounders.com">Visitar DRENYRA</a> |
        <a href="https://drenyrafounders.com/support">Soporte</a>
      </p>
      <p style="margin-top: 15px; font-size: 12px;">
        © ${new Date().getFullYear()} DRENYRA. Todos los derechos reservados.<br>
        Sistema de Gobernanza Financiera SUNAT 2026 Compliance
      </p>
    </div>
  `;
}
