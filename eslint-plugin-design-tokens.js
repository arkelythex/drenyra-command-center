/**
 * ESLint plugin — design token enforcement for Drenyra web.
 */

const OFF_BRAND_COLOR_PATTERN =
	/\b(?:text|bg|border|ring|fill|stroke)-(?:blue|indigo|violet|purple|pink|rose|sky|cyan|teal|emerald|lime|fuchsia)-\d{2,3}\b/;

const DECORATIVE_BLUR_PATTERN = /\bbackdrop-blur-(?:glass|md|lg|xl|2xl|3xl)\b/;

/** @type {import('eslint').ESLint.Plugin} */
const plugin = {
	rules: {
		"no-off-brand-colors": {
			meta: {
				type: "problem",
				docs: {
					description:
						"Disallow off-brand Tailwind palette colors in class names",
				},
			},
			create(context) {
				return {
					Literal(node) {
						if (typeof node.value !== "string") return;
						if (OFF_BRAND_COLOR_PATTERN.test(node.value)) {
							context.report({
								node,
								message:
									"Use design tokens (--color-*, var(--surface-*)) instead of off-brand Tailwind colors.",
							});
						}
					},
					TemplateElement(node) {
						const raw = node.value.raw;
						if (OFF_BRAND_COLOR_PATTERN.test(raw)) {
							context.report({
								node,
								message:
									"Use design tokens instead of off-brand Tailwind colors in template literals.",
							});
						}
					},
				};
			},
		},
		"no-hardcoded-design-values": {
			meta: {
				type: "suggestion",
				docs: {
					description: "Warn on decorative backdrop blur (Fiscal Editorial)",
				},
			},
			create(context) {
				return {
					Literal(node) {
						if (typeof node.value !== "string") return;
						if (DECORATIVE_BLUR_PATTERN.test(node.value)) {
							context.report({
								node,
								message:
									"Decorative backdrop-blur is deprecated — use SurfacePanel / flat editorial surfaces.",
							});
						}
					},
				};
			},
		},
		"no-inline-money-format": {
			meta: { type: "problem", docs: { description: "Use n() for money" } },
			create() {
				return {};
			},
		},
		"no-deprecated-typography-import": {
			meta: {
				type: "problem",
				docs: { description: "Use @/components/atoms/text" },
			},
			create() {
				return {};
			},
		},
	},
};

export default plugin;
