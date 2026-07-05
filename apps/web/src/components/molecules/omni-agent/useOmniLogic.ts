import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useArtifactEvents } from "@/context/ArtifactEventContext";
import { useSidebarWorkspace } from "@/context/SidebarWorkspaceContext";
import { resolveArtifactFromQuery } from "@/features/artifacts/artifact-factories";
import {
	type CommandItem,
	GHOST_SUGGESTIONS,
	NAVIGATION_COMMANDS,
	PLACEHOLDERS,
	QUICK_ACTIONS,
} from "./constants";

export const useOmniLogic = () => {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [mode, setMode] = useState<
		"default" | "navigation" | "actions" | "voice"
	>("default");
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [isThinking, setIsThinking] = useState(false);
	const [cot, setCot] = useState<string[]>([]);
	const [placeholderIndex, setPlaceholderIndex] = useState(0);

	const inputRef = useRef<HTMLInputElement>(null);
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const navigate = useNavigate();

	const { setIsWorkspaceMode } = useSidebarWorkspace();
	const { setActiveTraceId, setActiveArtifact } = useArtifactEvents();

	const filteredList = useMemo(() => {
		let sourceList: CommandItem[] = [];
		let cleanQuery = query.toLowerCase().trim();

		if (mode === "navigation") {
			sourceList = NAVIGATION_COMMANDS;
			if (cleanQuery.startsWith("/"))
				cleanQuery = cleanQuery.substring(1).trim();
		} else if (mode === "actions") {
			sourceList = QUICK_ACTIONS;
		} else {
			return [];
		}

		if (!cleanQuery) return sourceList;

		return sourceList.filter((item) => {
			const labelMatch = item.label.toLowerCase().includes(cleanQuery);
			const keywordMatch = item.keywords?.some((keyword) =>
				keyword.includes(cleanQuery),
			);
			return labelMatch || keywordMatch;
		});
	}, [query, mode]);

	const ghostSuggestion = useMemo(() => {
		const normalized = query.trim().toLowerCase();
		if (!normalized || mode !== "default") {
			return "";
		}

		return (
			GHOST_SUGGESTIONS.find(
				(suggestion) =>
					suggestion.startsWith(normalized) && suggestion !== normalized,
			) ?? ""
		);
	}, [mode, query]);

	const ghostCompletion = useMemo(() => {
		if (!ghostSuggestion) {
			return "";
		}
		return ghostSuggestion.slice(query.trim().length);
	}, [ghostSuggestion, query]);

	useEffect(() => {
		setSelectedIndex(0);
	}, [filteredList.length, mode]);

	useEffect(() => {
		if (query || !open) return;
		const interval = setInterval(() => {
			setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
		}, 4000);
		return () => clearInterval(interval);
	}, [query, open]);

	useEffect(() => {
		const down = (event: KeyboardEvent) => {
			if (
				event.key.toLowerCase() === "k" &&
				(event.metaKey || event.ctrlKey) &&
				event.shiftKey
			) {
				event.preventDefault();
				setOpen((current) => !current);
				setTimeout(() => inputRef.current?.focus(), 10);
			}
		};
		document.addEventListener("keydown", down);
		return () => document.removeEventListener("keydown", down);
	}, []);

	const navigateToItem = (item: CommandItem) => {
		if (item.path) {
			navigate({ to: item.path });
			setOpen(false);
			setMode("default");
			setQuery("");
			return;
		}

		setQuery(item.label);
		setOpen(false);
	};

	const acceptGhostSuggestion = () => {
		if (!ghostSuggestion) {
			return false;
		}
		setQuery(ghostSuggestion);
		return true;
	};

	const handleAction = async () => {
		const normalizedQuery = query.toLowerCase().trim();
		if (!normalizedQuery) return;

		const resolvedArtifact = resolveArtifactFromQuery(normalizedQuery);
		const traceId =
			resolvedArtifact?.metadata.traceId ?? `tr_${Date.now().toString(36)}`;
		setActiveTraceId(traceId);
		setIsThinking(true);
		setCot([]);

		const steps = [
			"Iniciando protocolo de trazabilidad...",
			"Analizando intención semántica...",
			resolvedArtifact?.metadata.source === "BANK"
				? "Consultando estado de tesorería y proveedores bancarios..."
				: "Consultando APIs de SUNAT (SOL)...",
			"Generando estructura de datos...",
		];

		for (const step of steps) {
			setCot((prev) => [...prev, step]);
			await new Promise((resolve) => setTimeout(resolve, 600));
		}

		if (resolvedArtifact) {
			setIsWorkspaceMode(true);
			setActiveArtifact(resolvedArtifact);
			setCot((prev) => [
				...prev,
				`Artifact generado: ${resolvedArtifact.title}`,
			]);
		} else {
			setCot((prev) => [
				...prev,
				"Comando procesado. Sin visualización requerida.",
			]);
		}

		setIsThinking(false);
		setQuery(""); // Clear input
	};

	useEffect(() => {
		if (!open) return;
		const down = (event: KeyboardEvent) => {
			const listLength = filteredList.length;

			if (event.key === "ArrowDown") {
				event.preventDefault();
				setSelectedIndex((current) =>
					listLength > 0 ? (current + 1) % listLength : 0,
				);
			} else if (event.key === "ArrowUp") {
				event.preventDefault();
				setSelectedIndex((current) =>
					listLength > 0 ? (current - 1 + listLength) % listLength : 0,
				);
			} else if (event.key === "Escape") {
				if (query) {
					setQuery("");
					setMode("default");
				} else {
					setOpen(false);
				}
			} else if (event.key === "Tab" && mode === "default" && ghostSuggestion) {
				event.preventDefault();
				acceptGhostSuggestion();
			} else if (event.key === "Enter") {
				event.preventDefault();
				if (listLength > 0 && filteredList[selectedIndex]) {
					navigateToItem(filteredList[selectedIndex]);
				} else if (mode === "default" && query.trim()) {
					void handleAction();
				}
			}
		};
		window.addEventListener("keydown", down);
		return () => window.removeEventListener("keydown", down);
	}, [open, mode, query, filteredList, selectedIndex, ghostSuggestion]);

	useEffect(() => {
		if (scrollContainerRef.current && filteredList.length > 0) {
			const selectedElement = scrollContainerRef.current.children[
				selectedIndex
			] as HTMLElement | undefined;
			selectedElement?.scrollIntoView({ block: "nearest", behavior: "smooth" });
		}
	}, [selectedIndex, filteredList]);

	useEffect(() => {
		if (query === "/") {
			setMode("navigation");
		} else if (query === "" && mode !== "actions") {
			setMode("default");
		}
	}, [query, mode]);

	const toggleActions = () => {
		if (mode === "actions") {
			setMode("default");
			setQuery("");
			return;
		}
		setMode("actions");
		setQuery("");
		inputRef.current?.focus();
	};

	const handleVoice = () => {
		setMode("voice");
		setQuery("");
		// Simulate voice input for demo
		setTimeout(() => {
			setQuery("Genera conciliación SIRE de enero y muestra discrepancias");
			setMode("default");
			setTimeout(() => void handleAction(), 500); // Auto-trigger
		}, 1500);
	};

	return {
		open,
		setOpen,
		query,
		setQuery,
		mode,
		setMode,
		selectedIndex,
		isThinking,
		cot,
		placeholderIndex,
		filteredList,
		inputRef,
		scrollContainerRef,
		toggleActions,
		handleVoice,
		navigateToItem,
		ghostSuggestion,
		ghostCompletion,
		acceptGhostSuggestion,
		handleAction,
	};
};
