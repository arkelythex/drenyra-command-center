// Drenyra Design Tokens — minimal
export const tokens = {
	colors: {
		primary: "#1a73e8",
		secondary: "#f5a623",
		background: "#0a0e27",
		foreground: "#e0e0e0",
		success: "#34d399",
		warning: "#fbbf24",
		error: "#ef4444",
	},
	radius: "0.5rem",
} as const;

export const MOTION_VARIANTS = {
	hidden: { opacity: 0, y: 10 },
	visible: { opacity: 1, y: 0 },
};

export function tokensToClasses(token: string) {
	return token;
}
