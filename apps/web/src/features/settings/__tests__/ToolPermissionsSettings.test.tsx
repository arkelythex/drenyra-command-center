import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { updateAsync, deleteAsync, state } = vi.hoisted(() => ({
	updateAsync: vi.fn().mockResolvedValue(undefined),
	deleteAsync: vi.fn().mockResolvedValue(undefined),
	state: { permissions: [] as unknown[] },
}));

vi.mock("../components/SettingsShell", () => ({
	SettingsShell: ({
		title,
		description,
		actions,
		children,
	}: {
		title: string;
		description: string;
		actions?: ReactNode;
		children: ReactNode;
	}) => (
		<div>
			<h1>{title}</h1>
			<p>{description}</p>
			{actions}
			{children}
		</div>
	),
}));
vi.mock("../hooks/useToolPermissions", () => ({
	useToolPermissions: () => ({ data: state.permissions, isLoading: false }),
	useCreateToolPermission: () => ({ mutateAsync: vi.fn(), isPending: false }),
	useUpdateToolPermission: () => ({
		mutateAsync: updateAsync,
		isPending: false,
	}),
	useDeleteToolPermission: () => ({ mutateAsync: deleteAsync }),
}));

import { ToolPermissionsSettings } from "../components/ToolPermissionsSettings";

const permission = {
	id: "p1",
	toolName: "emitir_factura",
	effect: "REQUIRE_APPROVAL",
	companyId: "c1",
	organizationId: null,
	createdAt: "",
	updatedAt: "",
};

beforeEach(() => {
	vi.clearAllMocks();
	state.permissions = [permission];
});

describe("ToolPermissionsSettings", () => {
	it("speaks plain Spanish without voseo or internal service names", () => {
		const { container } = render(<ToolPermissionsSettings />);
		expect(
			screen.getByRole("heading", {
				level: 1,
				name: "Permisos de herramientas",
			}),
		).toBeInTheDocument();
		expect(container.textContent).not.toMatch(
			/Controlá|Seleccioná|PermissionService/,
		);
	});

	it("changes a policy from its select", async () => {
		render(<ToolPermissionsSettings />);
		fireEvent.change(screen.getByLabelText("Política para emitir_factura"), {
			target: { value: "DENY" },
		});
		await waitFor(() =>
			expect(updateAsync).toHaveBeenCalledWith({
				id: "p1",
				data: { effect: "DENY" },
			}),
		);
	});

	it("asks for confirmation in a dialog, not window.confirm, before deleting", async () => {
		const confirmSpy = vi.fn();
		vi.stubGlobal("confirm", confirmSpy);
		render(<ToolPermissionsSettings />);

		fireEvent.click(
			screen.getByRole("button", {
				name: "Eliminar permiso para emitir_factura",
			}),
		);
		expect(deleteAsync).not.toHaveBeenCalled();
		expect(await screen.findByRole("alertdialog")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));
		await waitFor(() => expect(deleteAsync).toHaveBeenCalledWith("p1"));
		expect(confirmSpy).not.toHaveBeenCalled();
		vi.unstubAllGlobals();
	});

	it("explains an empty list", () => {
		state.permissions = [];
		render(<ToolPermissionsSettings />);
		expect(
			screen.getByText(/no hay permisos configurados/i),
		).toBeInTheDocument();
	});
});
