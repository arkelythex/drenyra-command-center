import { NextRequest, NextResponse } from "next/server";

// Newsletter signup endpoint
// POST /api/newsletter
// Body: { email: string }

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type NewsletterBody = {
	email?: unknown;
	newsletterConsent?: unknown;
	source?: unknown;
};

type LeadNotification = {
	email: string;
	source: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function parseNewsletterBody(value: unknown): NewsletterBody {
	return isRecord(value) ? value : {};
}

function escapeHtml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#039;");
}

async function sendLeadNotification({
	email,
	source,
}: LeadNotification): Promise<"sent" | "not_configured"> {
	const apiKey = process.env.RESEND_API_KEY?.trim();
	const from = process.env.RESEND_FROM_EMAIL?.trim();
	const to = process.env.LEADS_TO_EMAIL?.trim();

	if (!apiKey || !from || !to) return "not_configured";

	const response = await fetch("https://api.resend.com/emails", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			from,
			to,
			subject: "Nuevo lead de Arkelythex",
			html: `
				<h1>Nuevo lead de Arkelythex</h1>
				<p><strong>Email:</strong> ${escapeHtml(email)}</p>
				<p><strong>Origen:</strong> ${escapeHtml(source)}</p>
				<p><strong>Consentimiento newsletter:</strong> Sí</p>
			`,
			text: [
				"Nuevo lead de Arkelythex",
				`Email: ${email}`,
				`Origen: ${source}`,
				"Consentimiento newsletter: Sí",
			].join("\n"),
		}),
	});

	if (!response.ok) {
		throw new Error(`Resend failed with status ${response.status}`);
	}

	return "sent";
}

export async function POST(request: NextRequest) {
	try {
		const body = parseNewsletterBody(await request.json());
		const email = typeof body.email === "string" ? body.email.trim() : "";
		const source = typeof body.source === "string" ? body.source.trim() : "newsletter";

		// Validate email
		if (!email || !EMAIL_PATTERN.test(email)) {
			return NextResponse.json(
				{ error: "Invalid email address" },
				{ status: 400 },
			);
		}

		if (body.newsletterConsent !== true) {
			return NextResponse.json(
				{ error: "Newsletter consent is required" },
				{ status: 400 },
			);
		}

		const delivery = await sendLeadNotification({ email, source });

		if (delivery === "not_configured" && process.env.NODE_ENV === "production") {
			return NextResponse.json(
				{ error: "Lead delivery is not configured" },
				{ status: 503 },
			);
		}

		return NextResponse.json({
			success: true,
			message: "Successfully subscribed to newsletter",
			delivery,
		});
	} catch (error) {
		console.error("[Newsletter] Error:", error);
		return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
	}
}
