import { LucideIcon } from "lucide-react";

// ============================================================================
// BASE TYPES
// ============================================================================

export type Year = "2025" | "2026" | "2027" | "2028" | "2029" | "2030";
export type Status = "completed" | "in-progress" | "planned" | "pending";

// ============================================================================
// CONTENT TYPES
// ============================================================================

export interface PageHeader {
	badge: {
		text: string;
		icon: LucideIcon;
	};
	title: string;
	highlight: string;
	description: string;
}

export interface StatCard {
	value: string;
	label: string;
	icon: LucideIcon;
	trend?: string;
}

export interface FeatureCard {
	id?: string;
	title: string;
	description: string;
	icon: LucideIcon;
	href: string;
	badge?: string;
	external?: boolean;
	variant?: "default" | "accent" | "primary";
}

// ============================================================================
// INVESTOR TYPES
// ============================================================================

export interface InvestorMetric {
	value: string;
	label: string;
	icon: LucideIcon;
	sublabel?: string;
}

export interface InvestmentRound {
	type: string;
	target: string;
	valuation: string;
	minTicket: string;
}

export interface FundAllocation {
	category: string;
	percentage: number;
	color: string;
}

export interface TractionMetric {
	value: string;
	label: string;
	growth?: string;
}

export interface TeamMember {
	name: string;
	role: string;
	experience: string;
	avatar?: string;
	linkedin?: string;
}

// ============================================================================
// ROADMAP TYPES
// ============================================================================

export interface Milestone {
	id: string;
	title: string;
	description: string;
	icon: LucideIcon;
	completed: boolean;
	deliverables?: string[];
}

export interface QuarterData {
	id: string;
	quarter: string;
	year: string;
	theme: string;
	status: Status;
	milestones: Milestone[];
	targets?: {
		metric: string;
		value: string;
	}[];
}

export interface RoadmapPhase {
	year: string;
	title: string;
	description: string;
	metrics: string;
}

// ============================================================================
// VISION TYPES
// ============================================================================

export interface VisionPillar {
	id: string;
	title: string;
	description: string;
	icon: LucideIcon;
	target: string;
	year: Year;
}

export interface FutureMilestone {
	year: string;
	title: string;
	description: string;
	metrics: string;
}

export interface ImpactArea {
	title: string;
	description: string;
	icon: LucideIcon;
	metric: string;
	metricLabel: string;
}

// ============================================================================
// BRAND TYPES
// ============================================================================

export interface ColorToken {
	name: string;
	hex: string;
	usage: string;
	cssVar?: string;
}

export interface TypographyStyle {
	name: string;
	size: string;
	weight: string;
	lineHeight: string;
	letterSpacing?: string;
	usage: string;
}

export interface LogoVariant {
	name: string;
	background: "dark" | "light" | "glass";
	colors: string;
	usage: string;
	formats: string[];
}

export interface BrandVoice {
	do: string[];
	dont: string[];
}

// ============================================================================
// TECHNICAL TYPES
// ============================================================================

export interface ArchitectureLayer {
	name: string;
	tech: string[];
	description: string;
	icon: LucideIcon;
}

export interface TechStackItem {
	name: string;
	category: string;
	description: string;
	version?: string;
}

export interface ComplianceItem {
	regulation: string;
	status: Status;
	description: string;
	icon: LucideIcon;
}
