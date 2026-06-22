type RgbColor = { r: number; g: number; b: number };

const HEX_PATTERN = /^#(?<hex>[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const RGB_PATTERN =
	/^rgba?\(\s*(?<r>\d{1,3})\s*,\s*(?<g>\d{1,3})\s*,\s*(?<b>\d{1,3})(?:\s*,\s*(?<a>0|1|0?\.\d+))?\s*\)$/;

function normalizeChannel(value: number): number {
	return Math.min(255, Math.max(0, value));
}

export function parseRgbColor(input: string): RgbColor | null {
	const value = input.trim();
	const hexMatch = HEX_PATTERN.exec(value);
	if (hexMatch?.groups?.hex) {
		let hex = hexMatch.groups.hex;
		if (hex.length === 3) {
			hex = hex
				.split("")
				.map((char) => `${char}${char}`)
				.join("");
		}
		if (hex.length === 8) {
			hex = hex.slice(0, 6);
		}

		return {
			r: Number.parseInt(hex.slice(0, 2), 16),
			g: Number.parseInt(hex.slice(2, 4), 16),
			b: Number.parseInt(hex.slice(4, 6), 16),
		};
	}

	const rgbMatch = RGB_PATTERN.exec(value);
	if (!rgbMatch?.groups) {
		return null;
	}

	return {
		r: normalizeChannel(Number.parseInt(rgbMatch.groups.r, 10)),
		g: normalizeChannel(Number.parseInt(rgbMatch.groups.g, 10)),
		b: normalizeChannel(Number.parseInt(rgbMatch.groups.b, 10)),
	};
}

function linearize(channel: number): number {
	const normalized = channel / 255;
	return normalized <= 0.03928
		? normalized / 12.92
		: ((normalized + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(input: string | RgbColor): number | null {
	const color = typeof input === "string" ? parseRgbColor(input) : input;
	if (!color) {
		return null;
	}

	return (
		0.2126 * linearize(color.r) + 0.7152 * linearize(color.g) + 0.0722 * linearize(color.b)
	);
}

export function contrastRatio(foreground: string, background: string): number | null {
	const foregroundLuminance = relativeLuminance(foreground);
	const backgroundLuminance = relativeLuminance(background);
	if (foregroundLuminance === null || backgroundLuminance === null) {
		return null;
	}

	const lighter = Math.max(foregroundLuminance, backgroundLuminance);
	const darker = Math.min(foregroundLuminance, backgroundLuminance);
	return (lighter + 0.05) / (darker + 0.05);
}

export function passesWcagContrast(
	foreground: string,
	background: string,
	level: "AA" | "AAA" = "AA",
	isLargeText = false,
): boolean | null {
	const ratio = contrastRatio(foreground, background);
	if (ratio === null) {
		return null;
	}

	if (level === "AAA") {
		return ratio >= (isLargeText ? 4.5 : 7);
	}
	return ratio >= (isLargeText ? 3 : 4.5);
}

export function meetsContrastRatio(
	foreground: string,
	background: string,
	minimumRatio = 4.5,
): boolean | null {
	const ratio = contrastRatio(foreground, background);
	return ratio === null ? null : ratio >= minimumRatio;
}
