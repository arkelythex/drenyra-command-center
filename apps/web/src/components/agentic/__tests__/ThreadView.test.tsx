import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ThreadView, DEMO_MESSAGES } from '../ThreadView';

// ─── Mock stores ──────────────────────────────────────────────────────────────
const mockRenameThread = vi.fn();
const mockForkThread = vi.fn();

const mockThreadState = {
	activeThreadId: null as string | null,
	threads: [] as Array<{ id: string; title: string }>,
	renameThread: mockRenameThread,
	forkThread: mockForkThread,
};

vi.mock('@/stores/thread-store', () => ({
	useThreadStore: (selector: (s: typeof mockThreadState) => unknown) =>
		selector(mockThreadState),
}));

vi.mock('@/stores/artifact-store', () => ({
	useArtifactStore: (selector: (s: Record<string, unknown>) => unknown) =>
		selector({
			artifactCollapsed: {} as Record<string, boolean>,
			density: 'normal' as const,
			pinnedArtifacts: [] as Array<{ id: string }>,
			setArtifactCollapsed: vi.fn(),
			toggleArtifactCollapsed: vi.fn(),
			pinArtifact: vi.fn(),
			unpinArtifact: vi.fn(),
			setActiveArtifactId: vi.fn(),
		}),
}));

vi.mock('@/store/ui-store', () => ({
	useUIStore: (selector: (s: Record<string, unknown>) => unknown) =>
		selector({
			isRightRailOpen: false,
			toggleRightRail: vi.fn(),
			setRightPanelTab: vi.fn(),
		}),
}));

// ─── Mock UI components ───────────────────────────────────────────────────────
vi.mock('@/components/ui/scroll-area', () => ({
	ScrollArea: ({ children, ...props }: { children: React.ReactNode }) => (
		<div data-testid="scroll-area" {...props}>{children}</div>
	),
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
	DropdownMenu: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown">{children}</div>,
	DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-trigger">{children}</div>,
	DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-content">{children}</div>,
	DropdownMenuItem: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
		<button onClick={onClick} data-testid="dropdown-item">{children}</button>
	),
	DropdownMenuSeparator: () => <hr data-testid="dropdown-separator" />,
}));

// ─── Mock feature dependencies ────────────────────────────────────────────────
vi.mock('@/components/agentic/ApprovalCard', () => ({
	ApprovalCard: () => <div data-testid="approval-card" />,
}));

vi.mock('@/features/cognitive-hub/components/artifacts/ArtifactRenderer', () => ({
	ArtifactRenderer: () => <div data-testid="artifact-renderer" />,
}));

vi.mock('@/features/cognitive-hub/logic/artifact-extractor', () => ({
	extractArtifacts: () => [],
	stripArtifacts: (content: string) => content,
}));

// ─── Mock UI libs ─────────────────────────────────────────────────────────────
vi.mock('@/lib/utils', () => ({
	cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

vi.mock('lucide-react', () => {
	const icon = (name: string) =>
		function MockIcon(props: Record<string, unknown>) {
			return <span data-testid={`lucide-${name}`} {...props} />;
		};
	return {
		ChevronDown: icon('ChevronDown'),
		ChevronRight: icon('ChevronRight'),
		CheckCircle2: icon('CheckCircle2'),
		AlertCircle: icon('AlertCircle'),
		Loader2: icon('Loader2'),
		Terminal: icon('Terminal'),
		FileCode: icon('FileCode'),
		Bot: icon('Bot'),
		User: icon('User'),
		Sparkles: icon('Sparkles'),
		GitBranch: icon('GitBranch'),
		Pencil: icon('Pencil'),
		Copy: icon('Copy'),
		MoreHorizontal: icon('MoreHorizontal'),
		ExternalLink: icon('ExternalLink'),
		Pin: icon('Pin'),
		PinOff: icon('PinOff'),
		Maximize2: icon('Maximize2'),
		Minimize2: icon('Minimize2'),
		PanelRight: icon('PanelRight'),
	};
});

vi.mock('framer-motion', () => ({
	motion: {
		div: ({ children, ...props }: Record<string, unknown>) => <div {...props}>{children as React.ReactNode}</div>,
		span: ({ children, ...props }: Record<string, unknown>) => <span {...props}>{children as React.ReactNode}</span>,
	},
	AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('ThreadView', () => {
	it('renders demo messages when no props provided', () => {
		render(<ThreadView />);

		// Should show user message from DEMO_MESSAGES
		expect(screen.getByText(/Show me the financial summary/i)).toBeInTheDocument();
		// Should show agent response
		expect(screen.getByText(/Minera Summa S.A.C./i)).toBeInTheDocument();
	});

	it('renders loading history indicator', () => {
		render(<ThreadView loadingHistory={true} />);
		expect(screen.getByText(/Loading conversation history/i)).toBeInTheDocument();
	});

	it('renders empty state when no messages', () => {
		render(<ThreadView messages={[]} />);
		expect(screen.getByText(/No messages yet/i)).toBeInTheDocument();
		expect(screen.getByText(/Start a conversation/i)).toBeInTheDocument();
	});

	it('renders streaming indicator when isStreaming is true', () => {
		render(<ThreadView isStreaming={true} messages={[]} />);
		// StreamingIndicator renders three animated dots
		const dots = document.querySelectorAll('span.rounded-full');
		// There should be animated dots from the streaming indicator
		expect(dots.length).toBeGreaterThan(0);
	});

	it('renders a single message correctly', () => {
		const messages = [
			{
				id: 'test-msg-1',
				role: 'user' as const,
				content: 'Hello agent',
				timestamp: new Date().toISOString(),
			},
		];
		render(<ThreadView messages={messages} />);
		expect(screen.getByText('Hello agent')).toBeInTheDocument();
	});

	it('renders agent message with tool calls', () => {
		const messages = [
			{
				id: 'test-msg-2',
				role: 'agent' as const,
				content: 'Analysis complete',
				timestamp: new Date().toISOString(),
				toolCalls: [
					{
						id: 'tc-1',
						name: 'analyze_data',
						status: 'completed' as const,
						output: 'All good',
						exitCode: 0,
					},
				],
			},
		];
		render(<ThreadView messages={messages} />);
		expect(screen.getByText('Analysis complete')).toBeInTheDocument();
		expect(screen.getByText('analyze_data')).toBeInTheDocument();
	});

	it('renders system message', () => {
		const messages = [
			{
				id: 'test-msg-3',
				role: 'system' as const,
				content: 'System notification',
				timestamp: new Date().toISOString(),
			},
		];
		render(<ThreadView messages={messages} />);
		expect(screen.getByText('System notification')).toBeInTheDocument();
	});
});
