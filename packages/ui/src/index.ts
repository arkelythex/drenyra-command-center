/**
 * @drenyra/ui - Drenyra Design System
 *
 * Shared UI component library for Drenyra monorepo.
 * Provides consistent, accessible components with brand theming.
 *
 * @example
 * ```tsx
 * import { Button, Card, Badge } from "@drenyra/ui";
 * ```
 */

// Components
export {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "./components/AlertDialog";
export { Badge, type BadgeProps, type BadgeVariant } from "./components/Badge";
export {
	Button,
	type ButtonProps,
	type ButtonSize,
	type ButtonVariant,
} from "./components/Button";
export {
	Calendar,
	type CalendarProps,
} from "./components/Calendar";
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
} from "./components/Card";
export { Checkbox, type CheckboxProps } from "./components/Checkbox";
export {
	Command,
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
	CommandShortcut,
} from "./components/Command";
export {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "./components/Dialog";
export {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuPortal,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "./components/DropdownMenu";
export {
	EmptyState,
	type EmptyStateProps,
	type EmptyStateSize,
} from "./components/EmptyState";
export {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	useFormField,
} from "./components/Form";
export {
	Input,
	type InputProps,
} from "./components/Input";
export {
	Label,
	type LabelProps,
} from "./components/Label";
export {
	MetricCard,
	type MetricCardProps,
	type MetricCardTone,
	type MetricCardTrend,
	type MetricCardVariant,
} from "./components/MetricCard";
export {
	MetricCardSkeleton,
	type MetricCardSkeletonProps,
} from "./components/MetricCardSkeleton";
export {
	Panel,
	PanelHeader,
	type PanelProps,
} from "./components/Panel";
export {
	Popover,
	PopoverContent,
	type PopoverContentProps,
	PopoverTrigger,
} from "./components/Popover";
export {
	ScrollArea,
	type ScrollAreaProps,
} from "./components/ScrollArea";
export {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectScrollDownButton,
	SelectScrollUpButton,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
} from "./components/Select";
export {
	Skeleton,
	type SkeletonProps,
} from "./components/Skeleton";
export {
	Switch,
	type SwitchProps,
} from "./components/Switch";
export {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "./components/Tabs";
export {
	Textarea,
	type TextareaProps,
} from "./components/Textarea";
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
} from "./components/Tooltip";

// Utilities
export { cn } from "./lib/utils";
