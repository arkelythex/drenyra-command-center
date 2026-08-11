import type {
	FirmMetrics,
	OrganizationPrimitiveData,
	OrganizationProps,
	OrganizationSettings,
	OrganizationStatus,
} from "./types";
import {
	validateOrganizationBusinessRules,
	validateStatusTransition,
} from "./validators";

export class Organization {
	private constructor(private props: OrganizationProps) {
		validateOrganizationBusinessRules(this.props);
		Object.freeze(this);
	}

	static create(props: OrganizationProps): Organization {
		return new Organization(props);
	}

	static fromPrimitives(plainData: OrganizationPrimitiveData): Organization {
		const props: OrganizationProps = {
			id: plainData.id,
			name: plainData.name,
			ruc: plainData.ruc,
			slug: plainData.slug,
			...(plainData.settings !== undefined ? { settings: plainData.settings } : {}),
			status: plainData.status as OrganizationStatus,
			...(plainData.healthScore !== undefined ? { healthScore: plainData.healthScore } : {}),
			...(plainData.metrics !== undefined ? { metrics: plainData.metrics } : {}),
			createdAt:
				typeof plainData.createdAt === "string"
					? new Date(plainData.createdAt)
					: plainData.createdAt,
			updatedAt:
				typeof plainData.updatedAt === "string"
					? new Date(plainData.updatedAt)
					: plainData.updatedAt,
		};

		return new Organization(props);
	}

	suspend(reason?: string): Organization {
		validateStatusTransition(this.props.status, "SUSPENDED");

		return new Organization({
			...this.props,
			status: "SUSPENDED",
			...(reason
				? { settings: { ...this.props.settings, suspensionReason: reason } }
				: {}),
			updatedAt: new Date(),
		});
	}

	reactivate(): Organization {
		validateStatusTransition(this.props.status, "ACTIVE");

		return new Organization({
			...this.props,
			status: "ACTIVE",
			updatedAt: new Date(),
		});
	}

	updateSettings(settings: OrganizationSettings): Organization {
		return new Organization({
			...this.props,
			settings: { ...this.props.settings, ...settings },
			updatedAt: new Date(),
		});
	}

	updateHealthScore(score: number): Organization {
		return new Organization({
			...this.props,
			healthScore: score,
			...(this.props.metrics
				? { metrics: { ...this.props.metrics, healthPercentage: score } }
				: {}),
			updatedAt: new Date(),
		});
	}

	equals(other: Organization | null | undefined): boolean {
		if (!other) return false;
		return this.props.id === other.props.id;
	}

	get id(): string {
		return this.props.id;
	}

	get name(): string {
		return this.props.name;
	}

	get ruc(): string {
		return this.props.ruc;
	}

	get slug(): string {
		return this.props.slug;
	}

	get settings(): OrganizationSettings | undefined {
		return this.props.settings;
	}

	get status(): OrganizationStatus {
		return this.props.status;
	}

	get healthScore(): number | undefined {
		return this.props.healthScore;
	}

	get metrics(): FirmMetrics | undefined {
		return this.props.metrics;
	}

	get createdAt(): Date {
		return this.props.createdAt;
	}

	get updatedAt(): Date {
		return this.props.updatedAt;
	}

	toJSON(): Record<string, unknown> {
		return {
			id: this.props.id,
			name: this.props.name,
			ruc: this.props.ruc,
			slug: this.props.slug,
			settings: this.props.settings,
			status: this.props.status,
			healthScore: this.props.healthScore,
			metrics: this.props.metrics,
			createdAt: this.props.createdAt.toISOString(),
			updatedAt: this.props.updatedAt.toISOString(),
		};
	}
}
