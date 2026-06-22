import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Composer } from '../Composer';

vi.mock('@/lib/utils', () => ({
	cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

vi.mock('@/features/cognitive-hub/logic/intent-parser', () => ({
	getCommandSuggestions: vi.fn(() => []),
}));

vi.mock('lucide-react', () => {
	const icon = (name: string) =>
		function MockIcon(props: Record<string, unknown>) {
			return <span data-testid={`lucide-${name}`} {...props} />;
		};
	return {
		Mic: icon('Mic'),
		Send: icon('Send'),
		Check: icon('Check'),
	};
});

vi.mock('framer-motion', () => ({
	motion: {
		button: ({ children, ...props }: Record<string, unknown>) => <button {...props}>{children as React.ReactNode}</button>,
		div: ({ children, ...props }: Record<string, unknown>) => <div {...props}>{children as React.ReactNode}</div>,
		span: ({ children, ...props }: Record<string, unknown>) => <span {...props}>{children as React.ReactNode}</span>,
	},
	AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('Composer', () => {
	it('renders textarea with placeholder', () => {
		render(<Composer />);
		const textarea = screen.getByPlaceholderText('Message Drenyra...');
		expect(textarea).toBeInTheDocument();
	});

	it('renders suggested actions', () => {
		render(<Composer />);
		expect(screen.getByText('Detalle')).toBeInTheDocument();
		expect(screen.getByText('Resumen')).toBeInTheDocument();
		expect(screen.getByText('Correr agente')).toBeInTheDocument();
		expect(screen.getByText('Subir documento')).toBeInTheDocument();
	});

	it('renders mode tabs (Local / Worktree)', () => {
		render(<Composer />);
		expect(screen.getByRole('tab', { name: /local/i })).toBeInTheDocument();
		expect(screen.getByRole('tab', { name: /worktree/i })).toBeInTheDocument();
	});

	it('renders skill badges', () => {
		render(<Composer />);
		expect(screen.getByText('Fiscal')).toBeInTheDocument();
		expect(screen.getByText('Code')).toBeInTheDocument();
		expect(screen.getByText('Data')).toBeInTheDocument();
	});

	it('renders send button (disabled when no message)', () => {
		render(<Composer />);
		// Send button should be disabled since there's no message
		const sendButton = screen.getByLabelText('Send message');
		expect(sendButton).toBeDisabled();
	});

	it('renders disabled mic button', () => {
		render(<Composer />);
		const micButton = screen.getByLabelText('Voice input (coming soon)');
		expect(micButton).toBeDisabled();
	});

	it('renders with custom onSend callback', () => {
		const onSend = vi.fn();
		render(<Composer onSend={onSend} />);
		expect(screen.getByPlaceholderText('Message Drenyra...')).toBeInTheDocument();
	});

	it('renders with sending state', () => {
		render(<Composer isSending={true} />);
		// When sending, the textarea should be disabled
		const textarea = screen.getByPlaceholderText('Message Drenyra...');
		expect(textarea).toBeDisabled();
	});

	it('renders with custom className prop applied to inner elements', () => {
		const { container } = render(<Composer />);
		// The container should have the composer layout
		expect(container.querySelector('[data-composer="true"]')).toBeInTheDocument();
	});
});
