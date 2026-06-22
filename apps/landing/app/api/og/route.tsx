import { ImageResponse } from "next/og";

export const runtime = "edge";

const CANVAS = "#0A0A0A";
const TEXT = "#FAFAFA";
const MUTED = "#A3A3A3";
const LINE = "rgba(255,255,255,0.35)";

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);

		const title = searchParams.get("title") || "Arkelythex";
		const subtitle =
			searchParams.get("subtitle") ||
			"Infraestructura fiscal de élite para Perú";

		return new ImageResponse(
			(
				<div
					style={{
						height: "100%",
						width: "100%",
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						backgroundColor: CANVAS,
						position: "relative",
						fontFamily: "Inter, system-ui, sans-serif",
					}}
				>
					<div
						style={{
							position: "absolute",
							inset: 0,
							backgroundImage:
								"linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
							backgroundSize: "64px 64px",
							opacity: 0.5,
						}}
					/>

					<svg
						width="72"
						height="72"
						viewBox="0 0 100 100"
						fill="none"
						style={{ marginBottom: 40 }}
					>
						<g
							stroke={LINE}
							strokeWidth="2.25"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<polygon points="50,18 67.8,28.3 67.8,48.9 50,59.2 32.2,48.9 32.2,28.3" />
							<polygon points="50,6 78.3,22.3 78.3,54.9 50,71.2 21.7,54.9 21.7,22.3" />
							<line x1="50" y1="50" x2="50" y2="18" />
							<line x1="50" y1="50" x2="67.8" y2="28.3" />
							<line x1="50" y1="50" x2="67.8" y2="48.9" />
							<line x1="50" y1="50" x2="50" y2="59.2" />
							<line x1="50" y1="50" x2="32.2" y2="48.9" />
							<line x1="50" y1="50" x2="32.2" y2="28.3" />
						</g>
						<circle cx="50" cy="50" r="3.25" fill={TEXT} />
						<circle cx="50" cy="18" r="3.25" fill={TEXT} />
						<circle cx="67.8" cy="28.3" r="3.25" fill={TEXT} />
						<circle cx="67.8" cy="48.9" r="3.25" fill={TEXT} />
						<circle cx="50" cy="59.2" r="3.25" fill={TEXT} />
						<circle cx="32.2" cy="48.9" r="3.25" fill={TEXT} />
						<circle cx="32.2" cy="28.3" r="3.25" fill={TEXT} />
					</svg>

					<div
						style={{
							fontSize: 22,
							fontWeight: 600,
							color: MUTED,
							letterSpacing: "0.35em",
							textTransform: "uppercase",
							marginBottom: 20,
						}}
					>
						Arkelythex
					</div>

					<div
						style={{
							fontSize: 58,
							fontWeight: 600,
							color: TEXT,
							marginBottom: 16,
							letterSpacing: "-0.03em",
							textAlign: "center",
							lineHeight: 1.08,
							maxWidth: 980,
						}}
					>
						{title}
					</div>

					<div
						style={{
							fontSize: 26,
							color: MUTED,
							fontWeight: 400,
							textAlign: "center",
							maxWidth: 760,
							lineHeight: 1.35,
						}}
					>
						{subtitle}
					</div>

					<div
						style={{
							position: "absolute",
							bottom: 48,
							padding: "10px 24px",
							border: "1px solid rgba(255,255,255,0.15)",
							borderRadius: 999,
							color: MUTED,
							fontSize: 16,
							letterSpacing: "0.08em",
						}}
					>
						arkelythexfounders.com
					</div>
				</div>
			),
			{
				width: 1200,
				height: 630,
			},
		);
	} catch (e: unknown) {
		console.error("OG image generation failed:", e);
		return new Response("Failed to generate the image", {
			status: 500,
		});
	}
}
