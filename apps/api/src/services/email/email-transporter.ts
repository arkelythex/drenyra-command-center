import type { Transporter } from "nodemailer";
import nodemailer from "nodemailer";
import { createLogger } from "../../lib/logger";
import { getEmailConfig, getEmailFrom } from "./email-config";

const logger = createLogger({ module: "services/email-transporter" });

/**
 * Email Transporter Manager
 * Singleton pattern for nodemailer transporter
 */

export interface SendEmailOptions {
	to: string;
	subject: string;
	html: string;
	attachments?: Array<{
		filename: string;
		content: Buffer | string;
		contentType?: string;
	}>;
}

class EmailTransporter {
	private static instance: EmailTransporter;
	private transporter: Transporter | null = null;

	private constructor() {}

	/**
	 * Get singleton instance
	 */
	static getInstance(): EmailTransporter {
		if (!EmailTransporter.instance) {
			EmailTransporter.instance = new EmailTransporter();
		}
		return EmailTransporter.instance;
	}

	/**
	 * Get or create transporter
	 */
	getTransporter(): Transporter {
		if (this.transporter) {
			return this.transporter;
		}

		const config = getEmailConfig();
		this.transporter = nodemailer.createTransport(config);
		return this.transporter;
	}

	/**
	 * Send email
	 */
	async send(options: SendEmailOptions): Promise<void> {
		const transporter = this.getTransporter();
		const from = getEmailFrom();

		const mailOptions = {
			from: `${from.name} <${from.email}>`,
			to: options.to,
			subject: options.subject,
			html: options.html,
			attachments: options.attachments,
		};

		try {
			await transporter.sendMail(mailOptions);
			logger.info(
				{
					subject: options.subject,
					to: options.to,
					attachmentCount: options.attachments?.length ?? 0,
				},
				"Email sent",
			);
		} catch (error) {
			logger.error(
				{
					error,
					subject: options.subject,
					to: options.to,
				},
				"Error sending email",
			);
			throw new Error(
				`Failed to send email: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	/**
	 * Verify SMTP connection
	 */
	async verify(): Promise<boolean> {
		try {
			const transporter = this.getTransporter();
			await transporter.verify();
			logger.info("SMTP connection verified");
			return true;
		} catch (error) {
			logger.error({ error }, "SMTP connection failed");
			return false;
		}
	}
}

// Export singleton instance
export const emailTransporter = EmailTransporter.getInstance();
