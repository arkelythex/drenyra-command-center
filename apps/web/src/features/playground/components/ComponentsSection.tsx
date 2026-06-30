"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SurfacePanel } from "@/components/ui/SurfacePanel";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

function SectionHeading({ children }: { children: React.ReactNode }) {
	return (
		<h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
			{children}
		</h3>
	);
}

function DemoCard({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5">
			<h4 className="text-sm font-medium text-[var(--text-primary)] mb-4">
				{title}
			</h4>
			<div className="flex flex-wrap items-center gap-3">{children}</div>
		</div>
	);
}

export function ComponentsSection() {
	const [dialogOpen, setDialogOpen] = useState(false);
	const [checkboxChecked, setCheckboxChecked] = useState(false);
	const [selectValue, setSelectValue] = useState("");

	return (
		<section id="components" className="scroll-mt-20">
			<h2 className="n text-2xl font-bold tracking-tight text-[var(--text-primary)] mb-6">
				Components
			</h2>

			{/* Buttons */}
			<div className="mb-10">
				<SectionHeading>Buttons</SectionHeading>
				<div className="space-y-4">
					<DemoCard title="Variants">
						<Button variant="default">Default</Button>
						<Button variant="primary">Primary</Button>
						<Button variant="secondary">Secondary</Button>
						<Button variant="ghost">Ghost</Button>
						<Button variant="destructive">Danger</Button>
						<Button variant="outline">Outline</Button>
						<Button variant="link">Link</Button>
					</DemoCard>

					<DemoCard title="Sizes">
						<Button size="sm">Small</Button>
						<Button size="default">Default</Button>
						<Button size="lg">Large</Button>
					</DemoCard>

					<DemoCard title="States">
						<Button disabled>Disabled</Button>
						<Button loading>Loading</Button>
						<Button variant="primary">With Icon →</Button>
					</DemoCard>
				</div>
			</div>

			{/* Cards */}
			<div className="mb-10">
				<SectionHeading>Cards</SectionHeading>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<Card>
						<CardHeader>
							<CardTitle>Default Card</CardTitle>
							<CardDescription>
								This is a default card with header and content.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-[var(--text-secondary)]">
								Cards are the primary surface for grouping related content. They
								support header, title, description, content, and footer slots.
							</p>
						</CardContent>
						<CardFooter>
							<Button variant="secondary" size="sm">
								Action
							</Button>
						</CardFooter>
					</Card>

					<SurfacePanel padding="md" className="p-5">
						<h3 className="font-semibold text-[var(--text-primary)] mb-2">
							Surface Panel
						</h3>
						<p className="text-sm text-[var(--text-secondary)]">
							Flat editorial surfaces use hairline borders and solid backgrounds
							— no decorative blur (Fiscal Editorial v3).
						</p>
					</SurfacePanel>
				</div>
			</div>

			{/* Badges */}
			<div className="mb-10">
				<SectionHeading>Badges</SectionHeading>
				<DemoCard title="Variants">
					<Badge variant="default">Default</Badge>
					<Badge variant="secondary">Secondary</Badge>
					<Badge variant="success">Success</Badge>
					<Badge variant="warning">Warning</Badge>
					<Badge variant="danger">Danger</Badge>
					<Badge variant="info">Info</Badge>
					<Badge variant="outline">Outline</Badge>
					<Badge variant="destructive">Destructive</Badge>
				</DemoCard>

				<DemoCard title="With Dot Indicator">
					<Badge variant="success" dot>
						Active
					</Badge>
					<Badge variant="warning" dot>
						Pending
					</Badge>
					<Badge variant="danger" dot>
						Error
					</Badge>
					<Badge variant="info" dot>
						Info
					</Badge>
				</DemoCard>
			</div>

			{/* Inputs */}
			<div className="mb-10">
				<SectionHeading>Inputs & Forms</SectionHeading>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<DemoCard title="Text Input">
						<Input
							type="text"
							placeholder="Placeholder text"
							className="w-full"
						/>
					</DemoCard>
					<DemoCard title="Disabled Input">
						<Input
							type="text"
							placeholder="Disabled input"
							disabled
							className="w-full"
						/>
					</DemoCard>
					<DemoCard title="Textarea">
						<Textarea placeholder="Write something..." className="w-full" />
					</DemoCard>
					<DemoCard title="Input with Value">
						<Input
							type="text"
							defaultValue="Prefilled value"
							className="w-full"
						/>
					</DemoCard>
				</div>
			</div>

			{/* Dialog */}
			<div className="mb-10">
				<SectionHeading>Dialog</SectionHeading>
				<DemoCard title="Dialog Trigger">
					<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
						<DialogTrigger asChild>
							<Button variant="primary">Open Dialog</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Demo Dialog</DialogTitle>
								<DialogDescription>
									This is a demonstration of the dialog component. Dialogs are
									used for modal interactions that require user attention.
								</DialogDescription>
							</DialogHeader>
							<div className="py-4">
								<p className="text-sm text-[var(--text-secondary)]">
									You can put any content here. The dialog overlay has
									backdrop-blur and the content animates in with a scale + fade
									transition.
								</p>
							</div>
							<DialogFooter>
								<DialogClose asChild>
									<Button variant="secondary">Cancel</Button>
								</DialogClose>
								<Button variant="primary">Confirm</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</DemoCard>
			</div>

			{/* Select */}
			<div className="mb-10">
				<SectionHeading>Select</SectionHeading>
				<DemoCard title="Select Dropdown">
					<Select value={selectValue} onValueChange={setSelectValue}>
						<SelectTrigger className="w-[200px]">
							<SelectValue placeholder="Select an option" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="option-1">Option 1</SelectItem>
							<SelectItem value="option-2">Option 2</SelectItem>
							<SelectItem value="option-3">Option 3</SelectItem>
							<SelectItem value="option-4">Option 4</SelectItem>
						</SelectContent>
					</Select>
				</DemoCard>
			</div>

			{/* Checkbox */}
			<div className="mb-10">
				<SectionHeading>Checkbox</SectionHeading>
				<DemoCard title="Checkbox states">
					<div className="flex items-center gap-2">
						<Checkbox
							id="demo-checkbox"
							checked={checkboxChecked}
							onCheckedChange={(v) => setCheckboxChecked(v === true)}
						/>
						<label
							htmlFor="demo-checkbox"
							className="text-sm text-[var(--text-primary)] cursor-pointer"
						>
							{checkboxChecked ? "Checked" : "Unchecked"}
						</label>
					</div>
					<div className="flex items-center gap-2">
						<Checkbox id="demo-checkbox-disabled" disabled />
						<label
							htmlFor="demo-checkbox-disabled"
							className="text-sm text-[var(--text-muted)] cursor-not-allowed"
						>
							Disabled
						</label>
					</div>
				</DemoCard>
			</div>

			{/* Skeleton */}
			<div className="mb-10">
				<SectionHeading>Skeleton</SectionHeading>
				<DemoCard title="Loading Skeleton">
					<div className="w-full space-y-3">
						<Skeleton className="h-4 w-3/4" />
						<Skeleton className="h-4 w-1/2" />
						<Skeleton className="h-20 w-full rounded-lg" />
						<div className="flex gap-4">
							<Skeleton className="h-10 w-20 rounded-lg" />
							<Skeleton className="h-10 w-20 rounded-lg" />
						</div>
					</div>
				</DemoCard>
			</div>

			{/* Command Palette */}
			<div className="mb-6">
				<SectionHeading>Command Palette</SectionHeading>
				<DemoCard title="Command List (cmdk)">
					<div className="w-full rounded-lg border border-[var(--border-subtle)]">
						<Command>
							<CommandInput placeholder="Search commands..." />
							<CommandList>
								<CommandEmpty>No results found.</CommandEmpty>
								<CommandGroup heading="Actions">
									<CommandItem>Create Invoice</CommandItem>
									<CommandItem>Send Document</CommandItem>
									<CommandItem>Generate Report</CommandItem>
									<CommandItem>Search Transactions</CommandItem>
								</CommandGroup>
								<CommandGroup heading="Navigation">
									<CommandItem>Dashboard</CommandItem>
									<CommandItem>Invoices</CommandItem>
									<CommandItem>Settings</CommandItem>
								</CommandGroup>
							</CommandList>
						</Command>
					</div>
				</DemoCard>
			</div>
		</section>
	);
}
