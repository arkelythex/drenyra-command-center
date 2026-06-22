import * as TabsPrimitive from "@radix-ui/react-tabs";
import {
	type ComponentPropsWithoutRef,
	type ElementRef,
	forwardRef,
} from "react";
import { cn } from "../lib/utils";

const Tabs = TabsPrimitive.Root;

const TabsList = forwardRef<
	ElementRef<typeof TabsPrimitive.List>,
	ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
	<TabsPrimitive.List
		ref={ref}
		className={cn(
			"inline-flex h-[var(--n-row)] items-center gap-[var(--n-gap-sm)] rounded-[var(--radius-md)] bg-[var(--color-surface-3)] p-[var(--n-pad-sm)]",
			className,
		)}
		{...props}
	/>
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = forwardRef<
	ElementRef<typeof TabsPrimitive.Trigger>,
	ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
	<TabsPrimitive.Trigger
		ref={ref}
		className={cn(
			"inline-flex items-center justify-center whitespace-nowrap rounded-[var(--radius-sm)] px-[var(--n-pad-md)] py-[var(--n-pad-sm)] text-sm font-medium text-[var(--color-text-secondary)]",
			"transition-all duration-150",
			"data-[state=active]:bg-[var(--color-surface-1)] data-[state=active]:text-[var(--color-text-primary)] data-[state=active]:shadow-sm",
			"disabled:pointer-events-none disabled:opacity-50",
			className,
		)}
		{...props}
	/>
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = forwardRef<
	ElementRef<typeof TabsPrimitive.Content>,
	ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
	<TabsPrimitive.Content
		ref={ref}
		className={cn("mt-[var(--n-gap-md)] focus:outline-none", className)}
		{...props}
	/>
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsContent, TabsList, TabsTrigger };
