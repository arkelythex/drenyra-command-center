/**
 * Email Module Barrel Export
 * Centralized exports for email functionality
 */

export type { EmailConfig, EmailFrom } from "./email-config";
export { getEmailConfig, getEmailFrom } from "./email-config";
export type {
	InvoiceEmailData,
	OverdueNoticeData,
	PaymentConfirmationData,
	PaymentReminderData,
} from "./email-templates";
export type { SendEmailOptions } from "./email-transporter";
export { emailTransporter } from "./email-transporter";
