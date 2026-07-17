export enum VerticalType {
	DRENYRA = "drenyra",
	ANDINO = "andino",
	ADMIN = "admin",
	EDGE_TRAZ_AGRO = "edge-traz-agro",
	KUSE = "kuse",
}

export const ALL_VERTICALS: VerticalType[] = Object.values(
	VerticalType,
) as VerticalType[];

export const VERTICAL_LABELS: Record<VerticalType, string> = {
	[VerticalType.DRENYRA]: "Drenyra",
	[VerticalType.ANDINO]: "Andino Lab",
	[VerticalType.ADMIN]: "Admin",
	[VerticalType.EDGE_TRAZ_AGRO]: "Edge Traz Agro",
	[VerticalType.KUSE]: "Kuse Cowork",
};
