export interface NavItem {
	label: string;
	path: string;
	icon: string;
}

export interface VerticalAppManifest {
	id: string;
	name: string;
	description: string;
	icon: string;
	routePrefix: string;
	/** URL to remoteEntry.js in production — null in dev (runs standalone or proxy) */
	remoteEntry: string | null;
	navPriority: number;
	navItems: NavItem[];
}

export class VerticalAppRegistry {
	private apps = new Map<string, VerticalAppManifest>();

	register(manifest: VerticalAppManifest): void {
		if (this.apps.has(manifest.id)) {
			throw new Error(`Vertical app "${manifest.id}" already registered`);
		}
		this.apps.set(manifest.id, manifest);
	}

	get(id: string): VerticalAppManifest | undefined {
		return this.apps.get(id);
	}

	list(): VerticalAppManifest[] {
		return Array.from(this.apps.values()).sort(
			(a, b) => a.navPriority - b.navPriority,
		);
	}

	getNavigation(): NavItem[] {
		return this.list().flatMap((app) => app.navItems);
	}

	has(id: string): boolean {
		return this.apps.has(id);
	}

	registerAll(manifests: VerticalAppManifest[]): void {
		for (const m of manifests) {
			this.register(m);
		}
	}
}
