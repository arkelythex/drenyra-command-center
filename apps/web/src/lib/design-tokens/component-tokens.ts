/**
 * Codex-inspired component token CSS variable names.
 * Values are defined in `index.css` and overridden by theme packages.
 */
export const componentTokenVars = {
	button: {
		background: "--akx-component-button-background",
		text: "--akx-component-button-text",
		focusRing: "--akx-component-button-focus-ring",
		secondaryBg: "--akx-component-button-secondary-bg",
		secondaryBorder: "--akx-component-button-secondary-border",
		ghostText: "--akx-component-button-ghost-text",
		destructiveBg: "--akx-component-button-destructive-bg",
		destructiveBorder: "--akx-component-button-destructive-border",
		destructiveText: "--akx-component-button-destructive-text",
	},
	card: {
		bg: "--akx-card-bg",
		border: "--akx-card-border",
		glassBg: "--akx-card-glass-bg",
		glassBorder: "--akx-card-glass-border",
	},
	input: {
		bg: "--akx-input-bg",
		border: "--akx-input-border",
		borderFocus: "--akx-input-border-focus",
		focusRing: "--akx-input-focus-ring",
		placeholder: "--akx-input-placeholder",
		text: "--akx-input-text",
	},
	badge: {
		neutralBg: "--akx-badge-neutral-bg",
		neutralBorder: "--akx-badge-neutral-border",
		neutralText: "--akx-badge-neutral-text",
		secondaryBg: "--akx-badge-secondary-bg",
		secondaryBorder: "--akx-badge-secondary-border",
		secondaryText: "--akx-badge-secondary-text",
	},
	table: {
		headerBg: "--akx-table-header-bg",
		headerText: "--akx-table-header-text",
		rowHover: "--akx-table-row-hover",
		cellText: "--akx-table-cell-text",
		border: "--akx-table-border",
	},
	select: {
		triggerBg: "--akx-select-trigger-bg",
		triggerBorder: "--akx-select-trigger-border",
		triggerText: "--akx-select-trigger-text",
		triggerFocusBorder: "--akx-select-trigger-focus-border",
		triggerFocusRing: "--akx-select-trigger-focus-ring",
		contentBg: "--akx-select-content-bg",
		contentBorder: "--akx-select-content-border",
		itemHoverBg: "--akx-select-item-hover-bg",
		icon: "--akx-select-icon",
		label: "--akx-select-label",
		separator: "--akx-select-separator",
	},
	alert: {
		successBg: "--akx-alert-success-bg",
		successBorder: "--akx-alert-success-border",
		successText: "--akx-alert-success-text",
		warningBg: "--akx-alert-warning-bg",
		warningBorder: "--akx-alert-warning-border",
		warningText: "--akx-alert-warning-text",
		dangerBg: "--akx-alert-danger-bg",
		dangerBorder: "--akx-alert-danger-border",
		dangerText: "--akx-alert-danger-text",
		infoBg: "--akx-alert-info-bg",
		infoBorder: "--akx-alert-info-border",
		infoText: "--akx-alert-info-text",
	},
	checkbox: {
		border: "--akx-checkbox-border",
		checkedBg: "--akx-checkbox-checked-bg",
		checkedBorder: "--akx-checkbox-checked-border",
		checkedText: "--akx-checkbox-checked-text",
		focusRing: "--akx-checkbox-focus-ring",
	},
	dialog: {
		overlay: "--akx-dialog-overlay",
		contentBg: "--akx-dialog-content-bg",
		contentBorder: "--akx-dialog-content-border",
		closeBg: "--akx-dialog-close-bg",
		closeBorder: "--akx-dialog-close-border",
		closeText: "--akx-dialog-close-text",
		closeHoverBg: "--akx-dialog-close-hover-bg",
		closeHoverText: "--akx-dialog-close-hover-text",
		closeFocusRing: "--akx-dialog-close-focus-ring",
	},
} as const;

/** Tailwind arbitrary property helpers for component tokens. */
export const componentTokenClasses = {
	button: {
		primaryBg: "bg-[var(--akx-component-button-background)]",
		primaryText: "text-[var(--akx-component-button-text)]",
		focusRing: "focus-visible:ring-[var(--akx-component-button-focus-ring)]/55",
	},
	card: {
		bg: "bg-[var(--akx-card-bg)]",
		border: "border-[var(--akx-card-border)]",
		glassBg: "bg-[var(--akx-card-glass-bg)]",
		glassBorder: "border-[var(--akx-card-glass-border)]",
	},
	input: {
		bg: "bg-[var(--akx-input-bg)]",
		border: "border-[var(--akx-input-border)]",
		borderFocus: "focus:border-[var(--akx-input-border-focus)]",
		focusRing: "focus:ring-[var(--akx-input-focus-ring)]",
		placeholder: "placeholder:text-[var(--akx-input-placeholder)]",
		text: "text-[var(--akx-input-text)]",
	},
	badge: {
		neutral:
			"bg-[var(--akx-badge-neutral-bg)] border-[var(--akx-badge-neutral-border)] text-[var(--akx-badge-neutral-text)]",
		secondary:
			"bg-[var(--akx-badge-secondary-bg)] border-[var(--akx-badge-secondary-border)] text-[var(--akx-badge-secondary-text)]",
	},
	table: {
		header:
			"bg-[var(--akx-table-header-bg)] text-[var(--akx-table-header-text)]",
		rowHover: "hover:bg-[var(--akx-table-row-hover)]",
		cell: "text-[var(--akx-table-cell-text)]",
		border: "border-[var(--akx-table-border)]",
	},
	select: {
		trigger:
			"bg-[var(--akx-select-trigger-bg)] border-[var(--akx-select-trigger-border)] text-[var(--akx-select-trigger-text)]",
		triggerFocus:
			"focus:border-[var(--akx-select-trigger-focus-border)] focus:ring-[var(--akx-select-trigger-focus-ring)]",
		content:
			"bg-[var(--akx-select-content-bg)] border-[var(--akx-select-content-border)] text-[var(--akx-select-trigger-text)]",
		itemHover: "focus:bg-[var(--akx-select-item-hover-bg)]",
		icon: "text-[var(--akx-select-icon)]",
		label: "text-[var(--akx-select-label)]",
		separator: "bg-[var(--akx-select-separator)]",
	},
	alert: {
		success:
			"bg-[var(--akx-alert-success-bg)] border-[var(--akx-alert-success-border)] text-[var(--akx-alert-success-text)]",
		warning:
			"bg-[var(--akx-alert-warning-bg)] border-[var(--akx-alert-warning-border)] text-[var(--akx-alert-warning-text)]",
		danger:
			"bg-[var(--akx-alert-danger-bg)] border-[var(--akx-alert-danger-border)] text-[var(--akx-alert-danger-text)]",
		info: "bg-[var(--akx-alert-info-bg)] border-[var(--akx-alert-info-border)] text-[var(--akx-alert-info-text)]",
	},
	checkbox: {
		base: "border-[var(--akx-checkbox-border)]",
		checked:
			"data-[state=checked]:bg-[var(--akx-checkbox-checked-bg)] data-[state=checked]:border-[var(--akx-checkbox-checked-border)] data-[state=checked]:text-[var(--akx-checkbox-checked-text)]",
		focusRing:
			"focus:ring-[var(--akx-checkbox-focus-ring)] focus:ring-offset-[var(--background)]",
	},
	dialog: {
		overlay: "bg-[var(--akx-dialog-overlay)]",
		content:
			"bg-[var(--akx-dialog-content-bg)] border-[var(--akx-dialog-content-border)]",
		close:
			"bg-[var(--akx-dialog-close-bg)] border-[var(--akx-dialog-close-border)] text-[var(--akx-dialog-close-text)]",
		closeHover:
			"hover:bg-[var(--akx-dialog-close-hover-bg)] hover:text-[var(--akx-dialog-close-hover-text)]",
		closeFocus: "focus:ring-[var(--akx-dialog-close-focus-ring)]",
	},
} as const;
