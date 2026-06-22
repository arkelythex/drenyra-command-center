import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ReviewQueueList } from "./ReviewQueueList";
import type { ReviewItem } from "../types/review.types";

const BASE_ITEM: ReviewItem = {
	id: "doc-1",
	filename: "factura-demo.pdf",
	date: "2026-04-18",
	amount: 1200,
	confidence: 0.92,
	status: "conflict",
	conflicts: {
		total: {
			original: 1199,
			extracted: 1200,
			isDifferent: true,
			label: "Monto total",
			confidence: 0.88,
		},
	},
};

function getQueueItemElement(): HTMLElement {
	const filename = screen.getByText("factura-demo.pdf");
	const queueItem = filename.closest("button");
	if (!(queueItem instanceof HTMLElement)) {
		throw new Error("Expected queue item to be rendered as a native button");
	}
	return queueItem;
}

describe("ReviewQueueList", () => {
	it("preloads detail panel on pointer and focus intent without selecting", () => {
		const onSelect = vi.fn();
		const onItemIntent = vi.fn();

		render(
			<ReviewQueueList
				items={[BASE_ITEM]}
				selectedItemId={null}
				onSelect={onSelect}
				onItemIntent={onItemIntent}
			/>,
		);

		const queueItem = getQueueItemElement();

		fireEvent.pointerEnter(queueItem);
		fireEvent.focus(queueItem);

		expect(onItemIntent).toHaveBeenCalledTimes(2);
		expect(onItemIntent).toHaveBeenNthCalledWith(1, BASE_ITEM);
		expect(onItemIntent).toHaveBeenNthCalledWith(2, BASE_ITEM);
		expect(onSelect).not.toHaveBeenCalled();
	});

	it("keeps keyboard activation equivalent to click selection", async () => {
		const user = userEvent.setup();
		const onSelect = vi.fn();

		render(
			<ReviewQueueList
				items={[BASE_ITEM]}
				selectedItemId={null}
				onSelect={onSelect}
			/>,
		);

		const queueItem = getQueueItemElement();
		queueItem.focus();

		await user.keyboard("{Enter}");
		await user.keyboard(" ");

		expect(onSelect).toHaveBeenCalledTimes(2);
		expect(onSelect).toHaveBeenNthCalledWith(1, BASE_ITEM);
		expect(onSelect).toHaveBeenNthCalledWith(2, BASE_ITEM);
	});
});
