type HubEvidenceDrawerModule = typeof import("./hub-evidence-drawer");

let hubEvidenceDrawerModulePromise: Promise<HubEvidenceDrawerModule> | null =
	null;

export function loadHubEvidenceDrawerModule(): Promise<HubEvidenceDrawerModule> {
	hubEvidenceDrawerModulePromise ??= import("./hub-evidence-drawer");
	return hubEvidenceDrawerModulePromise;
}

export function preloadHubEvidenceDrawer(): void {
	void loadHubEvidenceDrawerModule().catch(() => {
		hubEvidenceDrawerModulePromise = null;
	});
}
