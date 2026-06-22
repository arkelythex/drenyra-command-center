import { beforeEach, describe, expect, it, vi } from "vitest";

const createTransportMock = vi.fn();
const sendMailMock = vi.fn();
const verifyMock = vi.fn();

vi.mock("nodemailer", () => ({
	default: {
		createTransport: createTransportMock,
	},
}));

vi.mock("../email/email-config", () => ({
	getEmailConfig: vi.fn(() => ({
		host: "smtp.test.local",
		port: 587,
		secure: false,
		auth: {
			user: "robot@test.local",
			pass: "secret",
		},
	})),
	getEmailFrom: vi.fn(() => ({
		name: "ARKELYTHEX Test",
		email: "robot@test.local",
	})),
}));

describe("emailTransporter", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		createTransportMock.mockReturnValue({
			sendMail: sendMailMock,
			verify: verifyMock,
		});
	});

	it("sends email using configured transporter", async () => {
		sendMailMock.mockResolvedValue(undefined);

		const { emailTransporter } = await import("../email/email-transporter");

		await emailTransporter.send({
			to: "user@test.local",
			subject: "Subject",
			html: "<p>Hello</p>",
		});

		expect(createTransportMock).toHaveBeenCalledOnce();
		expect(sendMailMock).toHaveBeenCalledWith({
			from: "ARKELYTHEX Test <robot@test.local>",
			to: "user@test.local",
			subject: "Subject",
			html: "<p>Hello</p>",
			attachments: undefined,
		});
	});

	it("returns false when smtp verification fails", async () => {
		verifyMock.mockRejectedValue(new Error("smtp down"));

		const { emailTransporter } = await import("../email/email-transporter");
		const isHealthy = await emailTransporter.verify();

		expect(isHealthy).toBe(false);
	});

	it("returns true when smtp verification succeeds", async () => {
		verifyMock.mockResolvedValue(true);

		const { emailTransporter } = await import("../email/email-transporter");
		const isHealthy = await emailTransporter.verify();

		expect(isHealthy).toBe(true);
	});

	it("sends email with attachments", async () => {
		sendMailMock.mockResolvedValue(undefined);

		const { emailTransporter } = await import("../email/email-transporter");

		const attachments = [
			{ filename: "invoice.pdf", content: Buffer.from("PDF") },
		];

		await emailTransporter.send({
			to: "user@test.local",
			subject: "Invoice",
			html: "<p>Please find attached</p>",
			attachments,
		});

		expect(sendMailMock).toHaveBeenCalledWith(
			expect.objectContaining({
				attachments,
			}),
		);
	});

	it("handles send mail errors gracefully", async () => {
		sendMailMock.mockRejectedValue(new Error("Send failed"));

		const { emailTransporter } = await import("../email/email-transporter");

		await expect(
			emailTransporter.send({
				to: "user@test.local",
				subject: "Test",
				html: "<p>Test</p>",
			}),
		).rejects.toThrow("Send failed");
	});
});

describe("email-config", () => {
	it("getEmailConfig returns configuration with defaults", async () => {
		const { getEmailConfig } = await import("../email/email-config");

		const config = getEmailConfig();

		expect(config).toHaveProperty("host");
		expect(config).toHaveProperty("port");
		expect(config).toHaveProperty("secure");
		expect(config).toHaveProperty("auth");
		expect(config.auth).toHaveProperty("user");
		expect(config.auth).toHaveProperty("pass");
		expect(typeof config.port).toBe("number");
	});

	it("getEmailFrom returns sender info with defaults", async () => {
		const { getEmailFrom } = await import("../email/email-config");

		const from = getEmailFrom();

		expect(from).toHaveProperty("name");
		expect(from).toHaveProperty("email");
		expect(typeof from.name).toBe("string");
		expect(typeof from.email).toBe("string");
	});
});
