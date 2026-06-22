export interface FileGroup {
	baseName: string;
	xml?: { file: File; fileName: string };
	pdf?: { file: File; fileName: string };
	image?: { file: File; fileName: string };
}
