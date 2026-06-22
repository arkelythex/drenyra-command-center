/**
 * Screen Reader / Accessibility Types
 */

export type AnnouncePriority = "polite" | "assertive";

export interface ScreenReaderAnnouncementProps {
	message: string;
	priority?: AnnouncePriority;
	clearAfter?: number; // ms
}

export interface SkipLinkProps {
	targetId: string;
	children?: React.ReactNode;
}

export interface AccessibleModalProps {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	children: React.ReactNode;
	announceOnOpen?: string;
}
