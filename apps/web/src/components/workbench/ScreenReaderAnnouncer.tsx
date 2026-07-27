import { useEffect, useState } from "react";

interface Announcement {
	id: number;
	message: string;
	priority: "polite" | "assertive";
}

let announcementId = 0;
const listeners: Set<(msg: Announcement) => void> = new Set();

/**
 * announce — call from anywhere to make a screen reader announcement.
 * @param message The text to announce
 * @param priority "polite" (default, doesn't interrupt) or "assertive" (interrupts)
 */
export function announce(
	message: string,
	priority: "polite" | "assertive" = "polite",
) {
	const msg = { id: ++announcementId, message, priority };
	for (const listener of listeners) {
		listener(msg);
	}
}

/**
 * ScreenReaderAnnouncer — live region for accessibility announcements.
 *
 * Renders two aria-live regions (polite + assertive) that screen readers
 * announce when content changes. Use the `announce()` function to trigger.
 *
 * Place once at the root layout level.
 */
export function ScreenReaderAnnouncer() {
	const [polite, setPolite] = useState("");
	const [assertive, setAssertive] = useState("");

	useEffect(() => {
		const listener = (msg: Announcement) => {
			if (msg.priority === "assertive") {
				setAssertive(msg.message);
			} else {
				setPolite(msg.message);
			}
		};
		listeners.add(listener);
		return () => {
			listeners.delete(listener);
		};
	}, []);

	return (
		<>
			{/* Polite announcements — screen readers wait for pause */}
			<div
				aria-live="polite"
				aria-atomic="true"
				className="sr-only"
				role="status"
			>
				{polite}
			</div>

			{/* Assertive announcements — screen readers interrupt */}
			<div
				aria-live="assertive"
				aria-atomic="true"
				className="sr-only"
				role="alert"
			>
				{assertive}
			</div>
		</>
	);
}
