import { useMemo, useState } from "react";
import { useHaptics } from "@/hooks/useHaptics";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";
import { n } from "@/lib/utils";
import { useAuthStore } from "../../auth/hooks/useAuth";
import type { Invoice } from "./useInvoices";
import { useInvoicesBoard } from "./useInvoicesBoard";

type InvoicesByStatus = ReturnType<typeof useInvoicesBoard>["invoicesByStatus"];
type BoardView = "summary" | "aging";

const toAmount = (invoice: Invoice) =>
	Number(invoice.totalAmount ?? invoice.amount ?? 0);

const startViewTransition = (update: () => void) => {
	const maybeTransitionApi = document as Document & {
		startViewTransition?: (callback: () => void) => void;
	};

	if (typeof maybeTransitionApi.startViewTransition === "function") {
		maybeTransitionApi.startViewTransition(update);
		return;
	}

	update();
};

const filterInvoicesByQuery = (
	invoicesByStatus: InvoicesByStatus,
	normalizedQuery: string,
): InvoicesByStatus => {
	if (!normalizedQuery) return invoicesByStatus;

	const include = (invoice: InvoicesByStatus["draft"][number]) => {
		const customerName = (invoice.customer?.name ?? "").toLowerCase();
		const invoiceNumber = (invoice.invoiceNumber ?? "").toLowerCase();
		return (
			customerName.includes(normalizedQuery) ||
			invoiceNumber.includes(normalizedQuery)
		);
	};

	return {
		draft: invoicesByStatus.draft.filter(include),
		sent: invoicesByStatus.sent.filter(include),
		overdue: invoicesByStatus.overdue.filter(include),
		paid: invoicesByStatus.paid.filter(include),
	};
};

export function useInvoicesBoardController() {
	const {
		allInvoices,
		invoicesByStatus,
		activeView,
		setActiveView,
		createInvoice,
		updateInvoiceStatus,
		isLoading,
		error,
	} = useInvoicesBoard();

	const [showCreateModal, setShowCreateModal] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const { trigger } = useHaptics();

	const normalizedQuery = searchQuery.trim().toLowerCase();

	const { user } = useAuthStore();
	const {
		companyContext: { companyId: activeCompanyId },
	} = useActiveCompanyContext();
	const companyId = user?.companyId ?? activeCompanyId;

	const filteredInvoicesByStatus = useMemo(
		() => filterInvoicesByQuery(invoicesByStatus, normalizedQuery),
		[invoicesByStatus, normalizedQuery],
	);

	const hasSearchResults =
		filteredInvoicesByStatus.draft.length +
			filteredInvoicesByStatus.sent.length +
			filteredInvoicesByStatus.overdue.length +
			filteredInvoicesByStatus.paid.length >
		0;

	const filteredColumnTotals = useMemo(
		() => ({
			sent: filteredInvoicesByStatus.sent.reduce(
				(sum, invoice) => sum + toAmount(invoice),
				0,
			),
			overdue: filteredInvoicesByStatus.overdue.reduce(
				(sum, invoice) => sum + toAmount(invoice),
				0,
			),
		}),
		[filteredInvoicesByStatus],
	);

	const handleViewChange = (view: BoardView) => {
		trigger("light");
		startViewTransition(() => setActiveView(view));
	};

	const handleMobileTabChange = (tabId: string) => {
		if (tabId === "summary" || tabId === "aging") {
			handleViewChange(tabId);
		}
	};

	const formatMoney = n;

	return {
		activeView,
		showCreateModal,
		searchQuery,
		normalizedQuery,
		companyId,
		isLoading,
		error,
		hasSearchResults,
		filteredInvoicesByStatus,
		filteredColumnTotals,
		allInvoices,
		createInvoice,
		updateInvoiceStatus,
		formatMoney,
		handleViewChange,
		handleMobileTabChange,
		setShowCreateModal,
		setSearchQuery,
	};
}
