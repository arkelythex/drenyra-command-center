/**
 * Button Component Stories
 *
 * Component documentation for Drenyra Design System
 */
import { Button } from "@/components/ui/button";

export default {
	title: "Atoms/Button",
	component: Button,
	tags: ["autodocs"],
	argTypes: {
		variant: {
			control: "select",
			options: [
				"default",
				"primary",
				"secondary",
				"ghost",
				"danger",
				"outline",
			],
			description: "Visual style variant of the button",
		},
		size: {
			control: "select",
			options: ["sm", "md", "lg", "icon"],
			description: "Size of the button",
		},
		disabled: {
			control: "boolean",
			description: "Whether the button is disabled",
		},
	},
};

// Primary Variants
export const Primary = {
	args: {
		variant: "primary",
		children: "Primary Button",
	},
};

export const Secondary = {
	args: {
		variant: "secondary",
		children: "Secondary Button",
	},
};

export const Ghost = {
	args: {
		variant: "ghost",
		children: "Ghost Button",
	},
};

export const Outline = {
	args: {
		variant: "outline",
		children: "Outline Button",
	},
};

// Size Variants
export const Sizes = {
	render: () => (
		<div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
			<Button size="sm" variant="primary">
				Small
			</Button>
			<Button size="md" variant="primary">
				Medium
			</Button>
			<Button size="lg" variant="primary">
				Large
			</Button>
			<Button size="icon" variant="primary">
				<span>+</span>
			</Button>
		</div>
	),
};

// States
export const States = {
	render: () => (
		<div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
			<Button variant="primary">Normal</Button>
			<Button variant="primary" disabled>
				Disabled
			</Button>
		</div>
	),
};

// With Icons
export const WithIcons = {
	render: () => (
		<div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
			<Button variant="primary">
				<span style={{ marginRight: "0.5rem" }}>🚀</span>
				Launch
			</Button>
			<Button variant="outline">
				Download
				<span style={{ marginLeft: "0.5rem" }}>⬇</span>
			</Button>
			<Button variant="ghost" size="icon">
				<span>⚙</span>
			</Button>
		</div>
	),
};
