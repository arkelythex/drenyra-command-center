import type { SkillId } from "./skill-id";
import type { InstallationStatus } from "./skill-status";

export interface SkillInstallationProps {
	id: string;
	companyId: string;
	skillId: SkillId;
	status: InstallationStatus;
	config: Record<string, unknown>;
	installedAt: Date;
	installedBy: string;
}

export class SkillInstallation {
	private constructor(
		public readonly id: string,
		public readonly companyId: string,
		public readonly skillId: SkillId,
		public readonly status: InstallationStatus,
		public readonly config: Readonly<Record<string, unknown>>,
		public readonly installedAt: Date,
		public readonly installedBy: string,
		public readonly updatedAt: Date,
	) {}

	static create(props: SkillInstallationProps): SkillInstallation {
		return new SkillInstallation(
			props.id,
			props.companyId,
			props.skillId,
			props.status,
			props.config,
			props.installedAt,
			props.installedBy,
			new Date(),
		);
	}

	static reconstitute(
		data: SkillInstallationProps & { updatedAt: Date },
	): SkillInstallation {
		return new SkillInstallation(
			data.id,
			data.companyId,
			data.skillId,
			data.status,
			data.config,
			data.installedAt,
			data.installedBy,
			data.updatedAt,
		);
	}

	withConfig(config: Record<string, unknown>): SkillInstallation {
		return new SkillInstallation(
			this.id,
			this.companyId,
			this.skillId,
			this.status,
			config,
			this.installedAt,
			this.installedBy,
			new Date(),
		);
	}

	withStatus(status: InstallationStatus): SkillInstallation {
		return new SkillInstallation(
			this.id,
			this.companyId,
			this.skillId,
			status,
			this.config,
			this.installedAt,
			this.installedBy,
			new Date(),
		);
	}

	isEnabled(): boolean {
		return this.status === "installed";
	}
}
