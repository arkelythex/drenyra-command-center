import type { SkillId } from "./skill-id";
import type { SkillCapability } from "./skill-capability";
import type { SkillCategory } from "./skill-category";
import type { SkillStatus } from "./skill-status";

export interface SkillProps {
	id: SkillId;
	name: string;
	description: string;
	category: SkillCategory;
	version: string;
	author: string;
	capabilities: SkillCapability[];
	status: SkillStatus;
	metadata?: Record<string, unknown>;
}

export class Skill {
	private constructor(
		public readonly id: SkillId,
		public readonly name: string,
		public readonly description: string,
		public readonly category: SkillCategory,
		public readonly version: string,
		public readonly author: string,
		public readonly capabilities: readonly SkillCapability[],
		public readonly status: SkillStatus,
		public readonly metadata: Readonly<Record<string, unknown>>,
		public readonly createdAt: Date,
		public readonly updatedAt: Date,
	) {}

	static create(props: SkillProps): Skill {
		return new Skill(
			props.id,
			props.name,
			props.description,
			props.category,
			props.version,
			props.author,
			props.capabilities,
			props.status,
			props.metadata ?? {},
			new Date(),
			new Date(),
		);
	}

	static reconstitute(data: SkillProps & { createdAt: Date; updatedAt: Date }): Skill {
		return new Skill(
			data.id,
			data.name,
			data.description,
			data.category,
			data.version,
			data.author,
			data.capabilities,
			data.status,
			data.metadata ?? {},
			data.createdAt,
			data.updatedAt,
		);
	}

	isInstalled(): boolean {
		return this.status === "active";
	}

	isDeprecated(): boolean {
		return this.status === "deprecated";
	}

	withUpdatedVersion(version: string): Skill {
		return new Skill(
			this.id,
			this.name,
			this.description,
			this.category,
			version,
			this.author,
			this.capabilities,
			this.status,
			this.metadata,
			this.createdAt,
			new Date(),
		);
	}
}
