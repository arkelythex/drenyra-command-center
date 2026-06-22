/**
 * Accessibility — Barrel
 * Re-exports everything for backward compatibility.
 */

export type {
	AccessibleModalProps,
	AnnouncePriority,
	ScreenReaderAnnouncementProps,
	SkipLinkProps,
} from "./accessibility.types";

export {
	useScreenReader,
	useFocusTrap,
	useHighContrastMode,
	usePrefersReducedMotion,
} from "./accessibility.utils";

export {
	ScreenReaderAnnouncement,
	SkipLink,
	AccessibleModal,
} from "./accessibility.components";
