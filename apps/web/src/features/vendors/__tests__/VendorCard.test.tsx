import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { VendorCard } from "../components/widgets/VendorCard";

const vendor = {
	id: "vendor-1",
	name: "Proveedor Uno",
	taxId: "20123456789",
	initials: "PU",
	totalSpend: 4500,
	condition: "NO HABIDO" as const,
	isRetentionAgent: true,
	isGoodTaxpayer: true,
	transactions: [{ id: "tx-1", date: "2026-03-01", description: "Servicio", category: "Servicios", amount: 500 }],
};

describe("VendorCard", () => {
	it("renders tax identity and compliance labels", () => {
		render(<VendorCard vendor={vendor} isExpanded={false} onToggle={vi.fn()} />);
		expect(screen.getByText("Proveedor Uno")).toBeInTheDocument();
		expect(screen.getByText(/RUC: 20123456789/)).toBeInTheDocument();
		expect(screen.getByText("No habido")).toBeInTheDocument();
	});

	it("toggles when the card is clicked", () => {
		const onToggle = vi.fn();
		render(<VendorCard vendor={vendor} isExpanded={false} onToggle={onToggle} />);
		fireEvent.click(screen.getByRole("button"));
		expect(onToggle).toHaveBeenCalledOnce();
	});

	it("renders transactions when expanded", () => {
		render(<VendorCard vendor={vendor} isExpanded onToggle={vi.fn()} />);
		expect(screen.getByText("Detalle operativo")).toBeInTheDocument();
		expect(screen.getByText("Servicio")).toBeInTheDocument();
	});
});
