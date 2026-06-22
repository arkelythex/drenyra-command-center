import type { useSensors } from "@dnd-kit/core";
import type { Dispatch, SetStateAction } from "react";

import type {
	ActualCashflowData,
	CashflowForecastData,
	CashflowProjectionData,
	CashflowVarianceData,
} from "../api/cashflow.api";

export type ColumnId = "pending" | "audit" | "scheduled" | "completed";
export type Currency = "PEN" | "USD" | "EUR";

export interface CashflowTask {
	id: string;
	title: string;
	amount: number;
	date: string;
	type: "INCOME" | "EXPENSE";
	priority: "LOW" | "MEDIUM" | "HIGH";
}

export interface BoardColumn {
	id: ColumnId;
	title: string;
	taskIds: string[];
}

export interface BoardState {
	columns: Record<ColumnId, BoardColumn>;
	tasks: Record<string, CashflowTask>;
	columnOrder: ColumnId[];
}

export interface CashflowHookStats {
	totalCash: number;
	incomePending: number;
	expensePending: number;
	actualInflows: number;
	actualOutflows: number;
	projectedNet: number;
	varianceNet: number;
	nextForecastNet: number;
}

export type Sourced<T> = T & { __source: "live" | "fallback" };

export interface CashflowHookResult {
	data: BoardState;
	viewMode: "board" | "forecast";
	setViewMode: Dispatch<SetStateAction<"board" | "forecast">>;
	activeTask: CashflowTask | null;
	sensors: ReturnType<typeof useSensors>;
	onDragStart: (event: import("@dnd-kit/core").DragStartEvent) => void;
	onDragEnd: (event: import("@dnd-kit/core").DragEndEvent) => void;
	stats: CashflowHookStats;
	actual: Sourced<ActualCashflowData>;
	projection: Sourced<CashflowProjectionData>;
	forecast: Sourced<CashflowForecastData>;
	variance: Sourced<CashflowVarianceData>;
	isLoading: boolean;
	isUsingFallback: boolean;
}
