/**
 * Accessibility — Barrel
 * Re-exports everything for backward compatibility.
 */

export {
	AccessibleModal,
	ScreenReaderAnnouncement,
	SkipLink,
} from "./accessibility.components";
export type {
	AccessibleModalProps,
	AnnouncePriority,
	ScreenReaderAnnouncementProps,
	SkipLinkProps,
} from "./accessibility.types";
export {
	useFocusTrap,
	useHighContrastMode,
	usePrefersReducedMotion,
	useScreenReader,
} from "./accessibility.utils";
