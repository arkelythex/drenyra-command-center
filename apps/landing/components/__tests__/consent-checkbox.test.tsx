// @vitest-environment happy-dom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ConsentCheckbox } from "@/components/ui/consent-checkbox";

describe("ConsentCheckbox", () => {
	afterEach(cleanup);

	it("renders a required named checkbox and emits changes", () => {
		const onCheckedChange = vi.fn();

		render(
			<ConsentCheckbox
				id="newsletter-consent"
				checked={false}
				label="Acepto recibir comunicaciones."
				onCheckedChange={onCheckedChange}
			/>,
		);

		const checkbox = screen.getByRole("checkbox", {
			name: "Acepto recibir comunicaciones.",
		});

		expect(checkbox.getAttribute("name")).toBe("newsletter-consent");
		expect(checkbox.hasAttribute("required")).toBe(true);

		fireEvent.click(checkbox);
		expect(onCheckedChange).toHaveBeenCalledWith(true);
	});
});
