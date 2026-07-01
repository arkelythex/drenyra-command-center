/**
 * UI Components Index
 *
 * Re-exports from @arkelythex/ui for components that don't need web-specific behavior.
 * Components with app-specific behavior (haptics, framer-motion) are re-exported from
 * their respective files in this directory, which now delegate to @arkelythex/ui.
 */

// Re-export utilities from @arkelythex/ui
export { cn } from "@arkelythex/ui";
export { Badge, type BadgeProps, type BadgeVariant } from "./badge";
export {
	Button,
	type ButtonProps,
	type ButtonSize,
	type ButtonVariant,
} from "./button";
export {
	Card,
	CardContent,
	type CardContentProps,
	CardDescription,
	type CardDescriptionProps,
	CardFooter,
	type CardFooterProps,
	CardHeader,
	type CardHeaderProps,
	type CardProps,
	CardTitle,
	type CardTitleProps,
} from "./card";
// Dialog components — now re-exported from @arkelythex/ui
export {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "./dialog";
export { Input, type InputProps } from "./input";
// Re-export simple wrappers and components without app-specific behavior
export { Label, type LabelProps } from "./label";
export { NavItem, type NavItemProps } from "./NavItem";
export { NavSection, type NavSectionProps } from "./NavSection";
export { PageHeader, type PageHeaderProps } from "./PageHeader";
export { PageShell, type PageShellProps } from "./PageShell";
export { StatusBadge, type StatusBadgeProps } from "./StatusBadge";
export { SurfaceCard, type SurfaceCardProps } from "./SurfaceCard";
export {
	SurfacePanel,
	type SurfacePanelProps,
	type SurfacePanelVariant,
} from "./SurfacePanel";
// Tooltip façade
export {
	Tooltip,
	TooltipContent,
	type TooltipContentProps,
	type TooltipProps,
	TooltipProvider,
	type TooltipProviderProps,
	TooltipRoot,
	type TooltipRootProps,
	TooltipTrigger,
	type TooltipTriggerProps,
} from "./tooltip";
