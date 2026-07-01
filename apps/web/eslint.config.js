import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";
import designTokensPlugin from "../../eslint-plugin-design-tokens.js";

export default tseslint.config(
	js.configs.recommended,
	...tseslint.configs.recommended,
	{
		files: ["src/**/*.{ts,tsx}"],
		plugins: {
			"react-hooks": reactHooks,
			"design-tokens": designTokensPlugin,
		},
		languageOptions: {
			parserOptions: {
				ecmaFeatures: { jsx: true },
			},
		},
		rules: {
			...reactHooks.configs.recommended.rules,

			// ── Design tokens — brand correctness ─────────────────────────────
			"design-tokens/no-off-brand-colors": "error",
			"design-tokens/no-hardcoded-design-values": "warn",
			"design-tokens/no-deprecated-glass-surface": "warn",
			"design-tokens/no-inline-money-format": "error",
			"design-tokens/no-deprecated-typography-import": "error",

			// ── TypeScript quality — progressively enabled ────────────────────
			"@typescript-eslint/no-explicit-any": "warn",
			"@typescript-eslint/no-unused-vars": [
				"warn",
				{ argsIgnorePattern: "^_" },
			],

			// ── React Hooks — intentionally relaxed (React Compiler handles this in prod) ─
			"react-hooks/set-state-in-effect": "off",
			"react-hooks/exhaustive-deps": "off",
			"react-hooks/incompatible-library": "off",
			"react-hooks/rules-of-hooks": "off",
			"react-hooks/purity": "off",
			"react-hooks/preserve-manual-memoization": "off",

			// ── General code style — relaxed for migration pace ──────────────
			"@typescript-eslint/ban-ts-comment": "off",
			"@typescript-eslint/no-empty-object-type": "off",
			"preserve-caught-error": "off",
			"no-useless-assignment": "off",
			"no-use-before-define": "off",
			"no-useless-escape": "off",

			// ── Console — allow structured logging only ─────────────────────
			"no-console": ["warn", { allow: ["error", "warn"] }],
		},
		settings: {
			react: { version: "detect" },
		},
	},
	{
		files: ["src/lib/design-tokens/**/*.ts"],
		rules: {
			"design-tokens/no-hardcoded-design-values": "off",
		},
	},
	{
		files: [
			"src/features/compliance/**/*.{ts,tsx}",
			"src/features/reports/**/*.{ts,tsx}",
			"src/features/settings/**/*.{ts,tsx}",
			"src/features/sunat/**/*.{ts,tsx}",
		],
		rules: {
			"design-tokens/no-hardcoded-design-values": "error",
			"design-tokens/no-deprecated-glass-surface": "error",
		},
	},
	{
		files: [
			"src/components/ui/glass-card.tsx",
			"src/components/ui/liquid-glass.tsx",
		],
		rules: {
			"design-tokens/no-deprecated-glass-surface": "off",
		},
	},
	{
		ignores: ["node_modules/", "dist/", "out/", "src/routeTree.gen.ts"],
	},
);
