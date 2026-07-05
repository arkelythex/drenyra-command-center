import { useMemo } from "react";

interface UseInlineGhostSuggestionInput {
	value: string;
	suggestions: string[];
}

interface UseInlineGhostSuggestionResult {
	ghostSuggestion: string;
	ghostCompletion: string;
	acceptGhostSuggestion: () => string | null;
}

export function useInlineGhostSuggestion({
	value,
	suggestions,
}: UseInlineGhostSuggestionInput): UseInlineGhostSuggestionResult {
	const normalizedValue = value.trim().toLowerCase();

	const ghostSuggestion = useMemo(() => {
		if (!normalizedValue) return "";

		return (
			suggestions.find((suggestion) => {
				const normalizedSuggestion = suggestion.trim().toLowerCase();
				return (
					normalizedSuggestion.startsWith(normalizedValue) &&
					normalizedSuggestion !== normalizedValue
				);
			}) ?? ""
		);
	}, [normalizedValue, suggestions]);

	const ghostCompletion = useMemo(() => {
		if (!ghostSuggestion) return "";
		return ghostSuggestion.slice(value.trim().length);
	}, [ghostSuggestion, value]);

	const acceptGhostSuggestion = () => {
		if (!ghostSuggestion) return null;
		return ghostSuggestion;
	};

	return {
		ghostSuggestion,
		ghostCompletion,
		acceptGhostSuggestion,
	};
}
