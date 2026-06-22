/**
 * Accessibility Components
 * ScreenReaderAnnouncement, SkipLink, AccessibleModal
 */

import { useEffect } from "react";

import { useFocusTrap, useScreenReader } from "./accessibility.utils";
import type {
	AccessibleModalProps,
	ScreenReaderAnnouncementProps,
	SkipLinkProps,
} from "./accessibility.types";

/**
 * Component for declarative screen reader announcements
 */
export function ScreenReaderAnnouncement({
	message,
	priority = "polite",
}: ScreenReaderAnnouncementProps) {
	const { announce } = useScreenReader();

	useEffect(() => {
		if (message) {
			announce(message, priority);
		}
	}, [message, priority, announce]);

	return null;
}

/**
 * Skip Link Component
 * WCAG 2.1 Required: Bypass blocks of repeated content
 */
export function SkipLink({
	targetId,
	children = "Saltar al contenido principal",
}: SkipLinkProps) {
	const handleClick = (e: React.MouseEvent) => {
		e.preventDefault();
		const target = document.getElementById(targetId);
		if (target) {
			target.focus();
			target.scrollIntoView({ behavior: "smooth" });
		}
	};

	return (
		<a
			href={`#${targetId}`}
			onClick={handleClick}
			className="
        sr-only focus:not-sr-only 
        focus:absolute focus:top-4 focus:left-4 
        focus:z-50 focus:px-4 focus:py-2
        focus:bg-primary focus:text-white
        focus:rounded-md focus:shadow-lg
        focus:font-bold focus:uppercase focus:tracking-wider
      "
		>
			{children}
		</a>
	);
}

/**
 * Accessible Modal Component
 * Combines focus trap, screen reader announcements, and escape handling
 */
export function AccessibleModal({
	isOpen,
	onClose,
	title,
	children,
	announceOnOpen = "Modal abierto",
}: AccessibleModalProps) {
	const { announce } = useScreenReader();
	const containerRef = useFocusTrap(isOpen);

	useEffect(() => {
		if (isOpen) {
			announce(announceOnOpen, "polite");
		}

		const handleEscape = () => onClose();
		document.addEventListener("focus-trap-escape", handleEscape);
		return () =>
			document.removeEventListener("focus-trap-escape", handleEscape);
	}, [isOpen, announce, announceOnOpen, onClose]);

	if (!isOpen) return null;

	return (
		<div
			ref={containerRef}
			role="dialog"
			aria-modal="true"
			aria-labelledby="modal-title"
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
			onClick={(e) => e.target === e.currentTarget && onClose()}
		>
			<div className="bg-background rounded-lg shadow-2xl max-w-lg w-full mx-4 p-6">
				<h2 id="modal-title" className="text-lg font-bold mb-4">
					{title}
				</h2>
				{children}
			</div>
		</div>
	);
}
