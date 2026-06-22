/**
 * Badge Component Stories
 *
 * Small status indicators and labels
 */
import { Badge } from "@/components/ui/badge";

export default {
	title: "Atoms/Badge",
	component: Badge,
	tags: ["autodocs"],
	argTypes: {
		variant: {
			control: "select",
			options: [
				"default",
				"secondary",
				"success",
				"warning",
				"danger",
				"info",
				"accent",
				"outline",
				"soft",
			],
			description: "Visual variant of the badge",
		},
		children: {
			control: "text",
			description: "Badge text content",
		},
	},
};

// Variants
export const Default = {
	args: {
		variant: "default",
		children: "Badge",
	},
};

export const Success = {
	args: {
		variant: "success",
		children: "Success",
	},
};

export const Warning = {
	args: {
		variant: "warning",
		children: "Warning",
	},
};

export const Danger = {
	args: {
		variant: "danger",
		children: "Danger",
	},
};

export const Info = {
	args: {
		variant: "info",
		children: "Info",
	},
};

// All Variants
export const AllVariants = {
	render: () => (
		<div className="flex gap-2 flex-wrap">
			<Badge variant="default">Default</Badge>
			<Badge variant="secondary">Secondary</Badge>
			<Badge variant="success">Success</Badge>
			<Badge variant="warning">Warning</Badge>
			<Badge variant="danger">Danger</Badge>
			<Badge variant="info">Info</Badge>
			<Badge variant="accent">Accent</Badge>
			<Badge variant="outline">Outline</Badge>
			<Badge variant="soft">Soft</Badge>
		</div>
	),
};
