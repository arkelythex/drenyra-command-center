"use client";

import {
	type ChangeEvent,
	type DragEvent,
	useCallback,
	useRef,
	useState,
} from "react";
import { DocumentPreviewModal } from "@/features/drenyra/components/codex/DocumentPreviewModal";
import { requestJson } from "@/lib/http-client";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";
import {
	type DocumentItem,
	useCentralBoardStore,
} from "@/stores/central-board-store";
import { DocumentRow } from "./components/DocumentRow";
import { DropZone } from "./components/DropZone";
import { EmptyState } from "./components/EmptyState";
import { DEMO_DOCUMENTS, getFileType } from "./DocumentsList.data";

export function DocumentsList() {
	const storeDocs = useCentralBoardStore((s) => s.documents);
	const removeDocument = useCentralBoardStore((s) => s.removeDocument);
	const addDocument = useCentralBoardStore((s) => s.addDocument);
	const { companyContext } = useActiveCompanyContext();
	const [isDragOver, setIsDragOver] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
	const dragCounter = useRef(0);

	const documents = storeDocs.length > 0 ? storeDocs : DEMO_DOCUMENTS;

	const handleRemove = useCallback(
		(id: string) => {
			removeDocument(id);
		},
		[removeDocument],
	);

	const handleDragEnter = useCallback((e: DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		dragCounter.current++;
		setIsDragOver(true);
	}, []);

	const handleDragLeave = useCallback((e: DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		dragCounter.current--;
		if (dragCounter.current === 0) {
			setIsDragOver(false);
		}
	}, []);

	const handleDragOver = useCallback((e: DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
	}, []);

	const uploadFile = useCallback(
		async (file: File) => {
			setIsUploading(true);
			const tempId = `upload-${Date.now()}`;

			try {
				addDocument({
					id: tempId,
					name: file.name,
					type: getFileType(file),
					size: file.size,
					uploadedAt: new Date().toISOString(),
					status: "processing",
				});

				const formData = new FormData();
				formData.append("file", file);

				const response = await requestJson<{ data: { id: string } }>(
					`/api/documents/upload`,
					{
						method: "POST",
						body: formData,
						headers: {
							"X-Company-Id": companyContext.companyId,
						},
					},
				);

				removeDocument(tempId);
				addDocument({
					id: response.data.id ?? `doc-${Date.now()}`,
					name: file.name,
					type: getFileType(file),
					size: file.size,
					uploadedAt: new Date().toISOString(),
					status: "ready",
				});
			} catch (err) {
				console.error("Upload failed:", err);
				removeDocument(tempId);
				addDocument({
					id: `error-${Date.now()}`,
					name: file.name,
					type: getFileType(file),
					size: file.size,
					uploadedAt: new Date().toISOString(),
					status: "error",
				});
			} finally {
				setIsUploading(false);
			}
		},
		[addDocument, removeDocument, companyContext.companyId],
	);

	const handleDrop = useCallback(
		async (e: DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
			setIsDragOver(false);
			dragCounter.current = 0;

			const files = Array.from(e.dataTransfer.files);
			const validFiles = files.filter((f) => {
				const type = getFileType(f);
				return type !== "other" || f.name.endsWith(".xml");
			});

			for (const file of validFiles) {
				await uploadFile(file);
			}
		},
		[uploadFile],
	);

	const handleFileSelect = useCallback(
		(e: ChangeEvent<HTMLInputElement>) => {
			const files = Array.from(e.target.files ?? []);
			for (const file of files) {
				uploadFile(file);
			}
			e.target.value = "";
		},
		[uploadFile],
	);

	return (
		<div className="flex h-full flex-col">
			<DropZone
				isDragOver={isDragOver}
				isUploading={isUploading}
				onDragEnter={handleDragEnter}
				onDragLeave={handleDragLeave}
				onDragOver={handleDragOver}
				onDrop={handleDrop}
				onFileSelect={handleFileSelect}
			/>

			<div className="flex-1 overflow-auto custom-scrollbar">
				<div className="p-4 space-y-3">
					{documents.length === 0 ? (
						<EmptyState />
					) : (
						documents.map((doc) => (
							<DocumentRow
								key={doc.id}
								doc={doc}
								onRemove={handleRemove}
								onPreview={setPreviewDoc}
							/>
						))
					)}
				</div>
			</div>

			<DocumentPreviewModal
				isOpen={previewDoc !== null}
				onClose={() => setPreviewDoc(null)}
				url={previewDoc?.url ?? null}
				fileName={previewDoc?.name ?? ""}
				mimeType={previewDoc?.mimeType}
			/>
		</div>
	);
}
