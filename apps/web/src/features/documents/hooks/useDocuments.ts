import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";
import { documentsQueryOptions } from "../documents.query";
import type { Document, ViewMode } from "../types/document.types";

export const useDocuments = () => {
	const { companyContext } = useActiveCompanyContext();
	const [viewMode, setViewMode] = useState<ViewMode>("grid");
	const [searchQuery, setSearchQuery] = useState("");

	const { data = [] } = useQuery(
		documentsQueryOptions(companyContext.companyId),
	);
	const documents = useMemo(() => {
		if (!searchQuery) return data as Document[];

		const normalizedQuery = searchQuery.toLowerCase();
		return (data as Document[]).filter(
			(doc) =>
				doc.series.toLowerCase().includes(normalizedQuery) ||
				doc.ruc.includes(searchQuery) ||
				doc.category.toLowerCase().includes(normalizedQuery),
		);
	}, [data, searchQuery]);

	return {
		documents,
		companyContext,
		viewMode,
		setViewMode,
		searchQuery,
		setSearchQuery,
	};
};
