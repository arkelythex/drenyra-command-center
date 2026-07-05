/**
 * DrenyraCommandCenter
 *
 * Command center fiscal supervisado — el corazón operativo de Drenyra.
 * Orquestador que compone hooks y subcomponentes extraídos para mantener
 * el archivo focalizado en mutations, queries y layout.
 */
import { useCallback, useState } from "react";
import { I18nProvider } from "../i18n/I18nProvider";
import {
	LayoutDashboard,
	Plus,
	Sparkles,
	Search,
	Settings,
	MessageSquare,
	FileText,
	HelpCircle,
	Menu,
	PanelRightOpen,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";
import {
	drenyraCommandCenterApi,
	type CreateFiscalCaseRequest,
} from "../api/drenyra-command-center.api";
import type { DrenyraAgentType } from "@drenyra/domain/drenyra";
import { inspectFiscalWorkItem } from "../api/drenyra-fiscal-work.api";
import { useDrenyraMutations } from "../hooks/useDrenyraMutations";
import { useDrenyraChatState } from "../hooks/useDrenyraChatState";
import { CommandCenterSidebar } from "./command-center-sidebar";
import { CommandCenterChat } from "./CommandCenterChat";
import { ChatContextPanel } from "./ChatContextPanel";
import { ChatSearch, type SearchResult } from "./ChatSearch";
import {
	SettingsPanel,
	DEFAULT_SETTINGS,
	type CommandCenterSettings,
} from "./SettingsPanel";
import { ShortcutReference } from "./ShortcutReference";
import { OnboardingTour } from "./OnboardingTour";
import { notifySettingsChanged } from "../hooks/useTheme";
import { useDrenyraKeyboardShortcuts } from "../hooks/useDrenyraKeyboardShortcuts";
import {
	DrenyraCommandPalette,
	type PaletteCmd,
} from "./DrenyraCommandPalette";

const drenyraKeys = {
	cases: ["drenyra", "cases"] as const,
	details: (caseId: string) => ["drenyra", "cases", caseId] as const,
};

export function DrenyraCommandCenter() {
	const {
		companyContext,
		availableCompanies,
		fiscalPeriod,
		setActiveCompanyById,
	} = useActiveCompanyContext();

	// ── UI State ────────────────────────────────────────────────────────
	const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
	const [selectedAgent, setSelectedAgent] =
		useState<DrenyraAgentType>("SIRE_AGENT");
	const [showPalette, setShowPalette] = useState(false);
	const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
	const [mobileRightPanelOpen, setMobileRightPanelOpen] = useState(false);
	const [showSearch, setShowSearch] = useState(false);
	const [showSettings, setShowSettings] = useState(false);
	const [showShortcuts, setShowShortcuts] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
	const [settings, setSettings] = useState<CommandCenterSettings>(() => {
		try {
			const saved = localStorage.getItem("drenyra:settings");
			return saved
				? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
				: DEFAULT_SETTINGS;
		} catch {
			return DEFAULT_SETTINGS;
		}
	});

	// ── Queries ─────────────────────────────────────────────────────────
	const casesQuery = useQuery({
		queryKey: drenyraKeys.cases,
		queryFn: drenyraCommandCenterApi.listCases,
	});
	const cases = casesQuery.data ?? [];
	const activeCaseId = selectedCaseId ?? cases[0]?.id ?? null;

	const detailsQuery = useQuery({
		queryKey: activeCaseId
			? drenyraKeys.details(activeCaseId)
			: ["drenyra", "cases", "empty"],
		queryFn: () => inspectFiscalWorkItem(activeCaseId ?? ""),
		enabled: Boolean(activeCaseId),
	});
	const inspectEnvelope = detailsQuery.data;
	const details =
		inspectEnvelope?.status === "success" ? inspectEnvelope.data : undefined;

	// ── Mutations ───────────────────────────────────────────────────────
	const {
		createCase,
		startRun,
		addEvidence,
		updateStatus,
		requestApproval,
		isBusy,
		invalidate,
	} = useDrenyraMutations(activeCaseId, {
		onCaseCreated: (id) => setSelectedCaseId(id),
	});

	// ── Chat State ──────────────────────────────────────────────────────
	const {
		chatStreaming,
		chatLastArtifact,
		pinnedArtifacts,
		handleChatContextChange,
		loadChatMessages,
	} = useDrenyraChatState(companyContext.companyId);

	const chatContext = chatStreaming
		? ("streaming" as const)
		: chatLastArtifact
			? ("artifact" as const)
			: activeCaseId
				? ("case" as const)
				: ("idle" as const);

	// ── Callbacks ───────────────────────────────────────────────────────
	const performSearch = useCallback(
		(query: string) => {
			setSearchQuery(query);
			if (!query.trim()) {
				setSearchResults([]);
				return;
			}
			const q = query.toLowerCase();
			const results: SearchResult[] = [];
			const msgs = loadChatMessages();
			for (const msg of msgs) {
				const idx = msg.content.toLowerCase().indexOf(q);
				if (idx !== -1) {
					results.push({
						messageId: msg.id,
						role: msg.role,
						content: msg.content,
						matchIndex: idx,
					});
				}
			}
			setSearchResults(results);
		},
		[loadChatMessages],
	);

	const handleResultClick = useCallback((result: SearchResult) => {
		setShowSearch(false);
		window.dispatchEvent(
			new CustomEvent("drenyra:scroll-to-message", {
				detail: result.messageId,
			}),
		);
	}, []);

	const handleSettingsChange = useCallback(
		(partial: Partial<CommandCenterSettings>) => {
			setSettings((prev) => {
				const next = { ...prev, ...partial };
				localStorage.setItem("drenyra:settings", JSON.stringify(next));
				notifySettingsChanged();
				return next;
			});
		},
		[],
	);

	const handleRunAgent = useCallback(
		() => startRun.mutate(selectedAgent),
		[startRun, selectedAgent],
	);

	useDrenyraKeyboardShortcuts({
		showPalette,
		setShowPalette,
		showSearch,
		setShowSearch,
		showSettings,
		setShowSettings,
		showShortcuts,
		setShowShortcuts,
		activeCaseId,
		startRun: { mutate: handleRunAgent },
	});

	// ── Palette commands ────────────────────────────────────────────────
	const paletteCommands: PaletteCmd[] = [
		{
			label: "Nuevo Caso",
			icon: Plus,
			shortcut: "⌘N",
			action: () =>
				document
					.querySelector<HTMLElement>('[data-action="new-case"]')
					?.click(),
		},
		{
			label: "Correr Agente",
			icon: Sparkles,
			shortcut: "⌘R",
			action: () => startRun.mutate(selectedAgent),
		},
		{
			label: "Subir Evidencia",
			icon: FileText,
			shortcut: "⌘U",
			action: () =>
				document
					.querySelector<HTMLElement>('[data-action="upload-evidence"]')
					?.click(),
		},
		{ separator: true },
		{
			label: "Modo Compacto",
			icon: LayoutDashboard,
			shortcut: "⌘1",
			action: () =>
				window.dispatchEvent(
					new CustomEvent("drenyra:density-change", { detail: "compact" }),
				),
		},
		{
			label: "Modo Detalle",
			icon: LayoutDashboard,
			shortcut: "⌘2",
			action: () =>
				window.dispatchEvent(
					new CustomEvent("drenyra:density-change", { detail: "detail" }),
				),
		},
		{
			label: "Solo Números",
			icon: LayoutDashboard,
			shortcut: "⌘3",
			action: () =>
				window.dispatchEvent(
					new CustomEvent("drenyra:density-change", { detail: "numbers-only" }),
				),
		},
		{ separator: true },
		{
			label: "Clear Chat",
			icon: MessageSquare,
			shortcut: "⌘⇧C",
			action: () => window.dispatchEvent(new CustomEvent("drenyra:clear-chat")),
		},
		{
			label: "Ayuda",
			icon: HelpCircle,
			shortcut: "/help",
			action: () => {},
		},
	];

	// ── Panel sections ──────────────────────────────────────────────────
	const sidebarContent =
		!casesQuery.isFetched && casesQuery.isLoading ? (
			<LoadingState message="Cargando casos fiscales..." />
		) : (
			<CommandCenterSidebar
				companyContext={companyContext}
				availableCompanies={availableCompanies}
				onCompanySelect={setActiveCompanyById}
				activePeriod={fiscalPeriod ?? new Date().toISOString().slice(0, 7)}
				cases={cases}
				selectedCaseId={activeCaseId}
				onCaseSelect={setSelectedCaseId}
				onCreateCase={() => {}}
				companyId={companyContext.companyId}
				notificationBadge={
					details?.approvals.filter((a) => a.status === "PENDING").length ?? 0
				}
			/>
		);

	const rightPanelContent = (
		<ChatContextPanel
			context={chatContext}
			activeArtifact={chatLastArtifact}
			caseDetails={details ?? null}
			pendingApprovalsCount={
				details?.approvals.filter((a) => a.status === "PENDING").length ?? 0
			}
			isStreaming={chatStreaming}
			pinnedArtifacts={pinnedArtifacts}
		/>
	);

	// ── Render ──────────────────────────────────────────────────────────
	return (
		<I18nProvider>
			<div className="grid min-h-[calc(100vh-4rem)] grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_360px]">
				{/* Mobile toggle bar */}
				<div className="sticky top-0 z-30 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-2 lg:col-span-3 lg:hidden">
					<div className="flex items-center gap-1">
						<button
							onClick={() => setMobileSidebarOpen(true)}
							className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--accent-subtle)] hover:text-[var(--text-primary)]"
							aria-label="Open sidebar"
						>
							<Menu className="h-5 w-5" />
						</button>
						<button
							onClick={() => setShowSearch((prev) => !prev)}
							className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--accent-subtle)] hover:text-[var(--text-primary)]"
							aria-label="Buscar en historial"
						>
							<Search className="h-4 w-4" />
						</button>
					</div>
					<div className="flex items-center gap-1">
						<button
							onClick={() => setShowSettings((prev) => !prev)}
							className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--accent-subtle)] hover:text-[var(--text-primary)]"
							aria-label="Configuración"
						>
							<Settings className="h-4 w-4" />
						</button>
						<button
							onClick={() => setShowShortcuts((prev) => !prev)}
							className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--accent-subtle)] hover:text-[var(--text-primary)]"
							aria-label="Atajos de teclado"
						>
							<HelpCircle className="h-4 w-4" />
						</button>
						<button
							onClick={() => setMobileRightPanelOpen(true)}
							className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--accent-subtle)] hover:text-[var(--text-primary)]"
							aria-label="Open info panel"
						>
							<PanelRightOpen className="h-5 w-5" />
						</button>
					</div>
				</div>

				{/* Sidebar — Desktop */}
				<div data-onboarding="sidebar" className="hidden lg:block">
					{sidebarContent}
				</div>

				{/* Main: Chat como UI principal */}
				<main data-onboarding="chat" className="min-w-0 p-4 lg:p-6">
					{(casesQuery.isError || detailsQuery.isError) && (
						<ErrorState
							message={
								casesQuery.error instanceof Error
									? casesQuery.error.message
									: detailsQuery.error instanceof Error
										? detailsQuery.error.message
										: undefined
							}
							onRetry={() => invalidate()}
						/>
					)}

					<CommandCenterChat
						companyId={companyContext.companyId}
						onContextChange={handleChatContextChange}
						cases={cases}
						selectedCaseId={activeCaseId}
						details={details}
						selectedAgent={selectedAgent}
						onSelectedAgentChange={setSelectedAgent}
						isBusy={isBusy}
						onCreateCase={(request: CreateFiscalCaseRequest) =>
							createCase.mutate(request)
						}
						onRunAgent={() => startRun.mutate(selectedAgent)}
						onAddEvidence={(request) => addEvidence.mutate(request)}
						onUpdateStatus={(status, reason) =>
							updateStatus.mutate({ status, reason })
						}
						onSelectCase={setSelectedCaseId}
						onRequestApproval={() => requestApproval.mutate()}
					/>
				</main>

				{/* Right panel — Desktop */}
				<div data-onboarding="right-panel" className="hidden lg:block">
					{rightPanelContent}
				</div>

				{/* Mobile sidebar drawer */}
				{mobileSidebarOpen && (
					<div className="fixed inset-0 z-40 lg:hidden">
						<div
							className="fixed inset-0 bg-black/50"
							onClick={() => setMobileSidebarOpen(false)}
							role="presentation"
							tabIndex={-1}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									setMobileSidebarOpen(false);
								}
							}}
						/>
						<aside
							className="fixed left-0 top-0 bottom-0 w-[280px] z-50 bg-[var(--surface-2)] border-r border-[var(--border-subtle)] shadow-2xl transition-transform duration-200"
							onClick={(e) => e.stopPropagation()}
						>
							{sidebarContent}
						</aside>
					</div>
				)}

				{/* Mobile right panel drawer */}
				{mobileRightPanelOpen && (
					<div className="fixed inset-0 z-40 lg:hidden">
						<div
							className="fixed inset-0 bg-black/50"
							onClick={() => setMobileRightPanelOpen(false)}
							role="presentation"
							tabIndex={-1}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									setMobileRightPanelOpen(false);
								}
							}}
						/>
						<aside
							className="fixed right-0 top-0 bottom-0 w-[280px] z-50 bg-[var(--surface-2)] border-l border-[var(--border-subtle)] shadow-2xl transition-transform duration-200"
							onClick={(e) => e.stopPropagation()}
						>
							{rightPanelContent}
						</aside>
					</div>
				)}

				<DrenyraCommandPalette
					isOpen={showPalette}
					onClose={() => setShowPalette(false)}
					commands={paletteCommands}
				/>

				{/* Search overlay (⌘F) */}
				{showSearch && (
					<div
						className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]"
						onClick={() => setShowSearch(false)}
						role="presentation"
						tabIndex={-1}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								setShowSearch(false);
							}
						}}
					>
						<div className="absolute inset-0 bg-black/40" />
						<div
							className="relative w-full max-w-2xl"
							onClick={(e) => e.stopPropagation()}
						>
							<ChatSearch
								results={searchResults}
								query={searchQuery}
								onQueryChange={performSearch}
								onResultClick={handleResultClick}
								onClose={() => setShowSearch(false)}
							/>
						</div>
					</div>
				)}

				{/* Shortcut Reference (⌘/) */}
				<ShortcutReference
					isOpen={showShortcuts}
					onClose={() => setShowShortcuts(false)}
				/>

				{/* Settings Panel (⌘,) */}
				{showSettings && (
					<div className="fixed inset-0 z-50 flex justify-end">
						<div
							className="absolute inset-0 bg-black/40"
							onClick={() => setShowSettings(false)}
							role="presentation"
							tabIndex={-1}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									setShowSettings(false);
								}
							}}
						/>
						<div className="relative" onClick={(e) => e.stopPropagation()}>
							<SettingsPanel
								isOpen={showSettings}
								onClose={() => setShowSettings(false)}
								settings={settings}
								onSettingsChange={handleSettingsChange}
							/>
						</div>
					</div>
				)}

				<Toaster
					position="bottom-right"
					richColors
					closeButton
					toastOptions={{ duration: 5000 }}
				/>

				<OnboardingTour />
			</div>
		</I18nProvider>
	);
}
