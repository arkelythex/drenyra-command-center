/**
 * Email Configuration
 * Handles SMTP configuration from environment variables
 */

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface EmailFrom {
  name: string;
  email: string;
}

/**
 * Get SMTP configuration from environment
 */
export function getEmailConfig(): EmailConfig {
  return {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  };
}

/**
 * Get email "from" configuration
 */
export function getEmailFrom(): EmailFrom {
  return {
    name: process.env.SMTP_FROM_NAME || 'ARKELYTHEX',
    email: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || '',
  };
}
