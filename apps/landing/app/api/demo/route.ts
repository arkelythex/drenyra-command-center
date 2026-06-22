import { NextRequest, NextResponse } from "next/server";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PLAN_LABELS: Record<string, string> = {
	esencial: "Esencial — S/149/mes",
	pro: "Pro — S/249/mes",
	scale: "Scale — S/1,199/mes",
	unsure: "Por definir",
};

type DemoRequestBody = {
	company?: unknown;
	email?: unknown;
	message?: unknown;
	name?: unknown;
	phone?: unknown;
	planInterest?: unknown;
	privacyConsent?: unknown;
};

type DemoLead = {
	company: string;
	email: string;
	message: string;
	name: string;
	phone: string;
	planInterest: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function parseDemoRequestBody(value: unknown): DemoRequestBody {
	return isRecord(value) ? value : {};
}

function readText(value: unknown): string {
	return typeof value === "string" ? value.trim() : "";
}

function escapeHtml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#039;");
}

function validateDemoLead(body: DemoRequestBody): DemoLead | Response {
	const name = readText(body.name);
	const email = readText(body.email);
	const company = readText(body.company);
	const phone = readText(body.phone);
	const message = readText(body.message);
	const requestedPlan = readText(body.planInterest) || "unsure";
	const planInterest = PLAN_LABELS[requestedPlan] ?? PLAN_LABELS.unsure;

	if (!name) {
		return NextResponse.json({ error: "Name is required" }, { status: 400 });
	}

	if (!email || !EMAIL_PATTERN.test(email)) {
		return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
	}

	if (!company) {
		return NextResponse.json({ error: "Company is required" }, { status: 400 });
	}

	if (!message) {
		return NextResponse.json({ error: "Message is required" }, { status: 400 });
	}

	if (body.privacyConsent !== true) {
		return NextResponse.json(
			{ error: "Privacy consent is required" },
			{ status: 400 },
		);
	}

	return { company, email, message, name, phone, planInterest };
}

async function sendDemoNotification(
	lead: DemoLead,
): Promise<"sent" | "not_configured"> {
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
			subject: `Nueva solicitud de piloto: ${lead.company}`,
			html: `
				<h1>Nueva solicitud de piloto Arkelythex</h1>
				<p><strong>Nombre:</strong> ${escapeHtml(lead.name)}</p>
				<p><strong>Email:</strong> ${escapeHtml(lead.email)}</p>
				<p><strong>Empresa:</strong> ${escapeHtml(lead.company)}</p>
				<p><strong>Teléfono:</strong> ${escapeHtml(lead.phone || "No informado")}</p>
				<p><strong>Plan de interés:</strong> ${escapeHtml(lead.planInterest)}</p>
				<p><strong>Mensaje:</strong></p>
				<p>${escapeHtml(lead.message)}</p>
				<p><strong>Consentimiento privacidad:</strong> Sí</p>
			`,
			text: [
				"Nueva solicitud de piloto Arkelythex",
				`Nombre: ${lead.name}`,
				`Email: ${lead.email}`,
				`Empresa: ${lead.company}`,
				`Teléfono: ${lead.phone || "No informado"}`,
				`Plan de interés: ${lead.planInterest}`,
				`Mensaje: ${lead.message}`,
				"Consentimiento privacidad: Sí",
			].join("\n"),
		}),
	});

	if (!response.ok) {
		const errorBody = await response.text();
		throw new Error(
			`Resend failed with status ${response.status}: ${errorBody.slice(0, 500)}`,
		);
	}

	return "sent";
}

export async function POST(request: NextRequest) {
	try {
		const body = parseDemoRequestBody(await request.json());
		const lead = validateDemoLead(body);

		if (lead instanceof Response) return lead;

		const delivery = await sendDemoNotification(lead);

		if (delivery === "not_configured" && process.env.NODE_ENV === "production") {
			return NextResponse.json(
				{ error: "Demo lead delivery is not configured" },
				{ status: 503 },
			);
		}

		return NextResponse.json({
			delivery,
			message: "Demo request received",
			success: true,
		});
	} catch (error) {
		console.error("[DemoRequest] Error:", error);
		return NextResponse.json(
			{ error: "Failed to submit demo request" },
			{ status: 500 },
		);
	}
}
