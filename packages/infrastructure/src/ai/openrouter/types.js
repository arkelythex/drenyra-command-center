export const AGENT_MODEL_MAP = {
	"security-audit-agent": ["anthropic/claude-sonnet-4.5", "openai/gpt-5.1"],
	"quality-analyzer-agent": [
		"anthropic/claude-sonnet-4.5",
		"deepseek/deepseek-coder-v3.2",
	],
	"performance-analyzer-agent": [
		"anthropic/claude-sonnet-4.5",
		"openai/gpt-5.1",
	],
	"code-generator-agent": [
		"anthropic/claude-opus-4.5",
		"deepseek/deepseek-coder-v3.2",
		"openai/gpt-5.1",
	],
	"documentation-agent": ["anthropic/claude-sonnet-4.5", "openai/gpt-5.1"],
	"sunat-compliance-agent": ["anthropic/claude-sonnet-4.5", "openai/gpt-5.1"],
	"tax-optimizer-agent": [
		"anthropic/claude-sonnet-4.5",
		"google/gemini-3-pro-preview",
	],
	"financial-analyzer-agent": ["anthropic/claude-sonnet-4.5", "openai/gpt-5.1"],
	"model-trainer-agent": ["openai/gpt-5.1", "google/gemini-3-pro-preview"],
	"prediction-engine-agent": ["openai/gpt-5.1", "anthropic/claude-sonnet-4.5"],
	"anomaly-detector-agent": ["openai/gpt-5.1", "google/gemini-3-pro-preview"],
	default: ["openrouter/auto", "anthropic/claude-sonnet-4.5", "openai/gpt-5.1"],
};
