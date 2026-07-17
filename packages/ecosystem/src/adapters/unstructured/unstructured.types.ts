export type UnstructuredOperation =
	| {
			type: "document.chunk";
			fileContent: string;
			filename: string;
			strategy?: "auto" | "fast" | "ocr_only" | "hi_res";
	  }
	| {
			type: "document.extract";
			fileContent: string;
			filename: string;
			includePageBreaks?: boolean;
	  }
	| { type: "document.table_extract"; fileContent: string; filename: string }
	| { type: "document.classify"; fileContent: string; filename: string }
	| { type: "server.health" };

export interface UnstructuredElement {
	type: string;
	text: string;
	metadata: {
		filename: string;
		page_number?: number;
		filetype: string;
		category?: string;
	};
}

export interface UnstructuredTableElement extends UnstructuredElement {
	type: "Table";
	metadata: UnstructuredElement["metadata"] & { text_as_html?: string };
}

export interface UnstructuredClassificationResult {
	filename: string;
	filetype: string;
	category: string;
	confidence: number;
}
export interface UnstructuredApiResponse<T> {
	data: T;
}
