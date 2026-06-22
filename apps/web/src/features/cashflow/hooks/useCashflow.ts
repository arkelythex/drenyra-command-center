import {
	type DragEndEvent,
	type DragStartEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { captureError } from "@/lib/monitoring";
import { useActiveCompanyContext } from "../../../lib/use-active-company-context";
import { bankingApi } from "../../banking/api/banking.api";
import { bankingKeys } from "../../banking/api/query-keys";
import { cashflowApi } from "../api/cashflow.api";
import { cashflowKeys } from "../api/query-keys";
import {
	COLUMN_TITLES,
	DEFAULT_ACTUAL_WINDOW_DAYS,
	DEFAULT_CURRENCY,
	DEFAULT_FORECAST_MONTHS,
	DEFAULT_PROJECTION_DAYS,
	FALLBACK_ACTUAL_BASE,
	FALLBACK_COLUMN_TASK_IDS,
	FALLBACK_FORECAST_BASE,
	FALLBACK_LIQUIDITY,
	FALLBACK_PROJECTION_BASE,
	FALLBACK_TASKS,
} from "../lib/cashflow-constants";
import {
	buildBoardState,
	buildProjectionTasks,
	buildRemoteColumns,
	buildVarianceFallback,
	extractTotalBalance,
	findColumnForTask,
	formatDate,
	indexTasks,
} from "../lib/cashflow-utils";
import type {
	CashflowHookResult,
	CashflowHookStats,
	CashflowTask,
	ColumnId,
	Sourced,
} from "../types/cashflow-types";

// Re-export for backward compatibility — components import CashflowTask from this file
export type { CashflowTask } from "../types/cashflow-types";

const useCashflow = (): CashflowHookResult => {
	const {
		companyContext: { companyId },
	} = useActiveCompanyContext();
	const [viewMode, setViewMode] = useState<"board" | "forecast">("board");
	const [activeTask, setActiveTask] = useState<CashflowTask | null>(null);
	const period = useMemo(() => {
		const endDate = new Date();
		const startDate = new Date(endDate);
		startDate.setDate(endDate.getDate() - DEFAULT_ACTUAL_WINDOW_DAYS);

		return {
			startDate,
			endDate,
			startKey: formatDate(startDate),
			endKey: formatDate(endDate),
		};
	}, []);

	const projectionQuery = useQuery({
		queryKey: cashflowKeys.projection(
			companyId,
			DEFAULT_PROJECTION_DAYS,
			DEFAULT_CURRENCY,
		),
		queryFn: async (): Promise<Sourced<import("../api/cashflow.api").CashflowProjectionData>> => {
			try {
				const result = await cashflowApi.getProjection({
					companyId,
					days: DEFAULT_PROJECTION_DAYS,
					currency: DEFAULT_CURRENCY,
				});
				if (!result.ok) throw new Error(result.error);
				return { ...result.data, __source: "live" };
			} catch (error) {
				captureError(
					error instanceof Error
						? error
						: new Error("Failed to fetch cashflow projection"),
					{ companyId, source: "features/cashflow/useCashflow.projection" },
				);
				return {
					...FALLBACK_PROJECTION_BASE,
					companyId,
					__source: "fallback",
				};
			}
		},
		staleTime: 60_000,
	});

	const actualQuery = useQuery({
		queryKey: cashflowKeys.actual(
			companyId,
			period.startKey,
			period.endKey,
			DEFAULT_CURRENCY,
		),
		queryFn: async (): Promise<Sourced<import("../api/cashflow.api").ActualCashflowData>> => {
			try {
				const result = await cashflowApi.getActual({
					companyId,
					startDate: period.startKey,
					endDate: period.endKey,
					currency: DEFAULT_CURRENCY,
				});
				if (!result.ok) throw new Error(result.error);
				return { ...result.data, __source: "live" };
			} catch (error) {
				captureError(
					error instanceof Error
						? error
						: new Error("Failed to fetch actual cashflow"),
					{ companyId, source: "features/cashflow/useCashflow.actual" },
				);
				return {
					...FALLBACK_ACTUAL_BASE,
					companyId,
					period: {
						startDate: period.startKey,
						endDate: period.endKey,
					},
					__source: "fallback",
				};
			}
		},
		staleTime: 60_000,
	});

	const forecastQuery = useQuery({
		queryKey: cashflowKeys.forecast(
			companyId,
			DEFAULT_FORECAST_MONTHS,
			DEFAULT_CURRENCY,
		),
		queryFn: async (): Promise<Sourced<import("../api/cashflow.api").CashflowForecastData>> => {
			try {
				const result = await cashflowApi.getForecast({
					companyId,
					months: DEFAULT_FORECAST_MONTHS,
					currency: DEFAULT_CURRENCY,
				});
				if (!result.ok) throw new Error(result.error);
				return { ...result.data, __source: "live" };
			} catch (error) {
				captureError(
					error instanceof Error
						? error
						: new Error("Failed to fetch cashflow forecast"),
					{ companyId, source: "features/cashflow/useCashflow.forecast" },
				);
				return {
					...FALLBACK_FORECAST_BASE,
					companyId,
					__source: "fallback",
				};
			}
		},
		staleTime: 60_000,
	});

	const liquidityQuery = useQuery({
		queryKey: bankingKeys.summary(companyId),
		queryFn: async (): Promise<{
			totalBalance: number;
			__source: "live" | "fallback";
		}> => {
			try {
				const result = await bankingApi.getSummary();
				if (!result.ok) throw new Error(result.error);
				return {
					totalBalance: extractTotalBalance(result.data),
					__source: "live",
				};
			} catch (error) {
				captureError(
					error instanceof Error
						? error
						: new Error("Failed to fetch banking summary"),
					{ companyId, source: "features/cashflow/useCashflow.liquidity" },
				);
				return {
					totalBalance: FALLBACK_LIQUIDITY,
					__source: "fallback",
				};
			}
		},
		staleTime: 60_000,
	});

	const varianceQuery = useQuery({
		queryKey: cashflowKeys.variance(
			companyId,
			period.startKey,
			period.endKey,
			DEFAULT_CURRENCY,
		),
		queryFn: async (): Promise<Sourced<import("../api/cashflow.api").CashflowVarianceData>> => {
			try {
				const result = await cashflowApi.getVariance({
					companyId,
					startDate: period.startKey,
					endDate: period.endKey,
					currency: DEFAULT_CURRENCY,
				});
				if (!result.ok) throw new Error(result.error);
				return { ...result.data, __source: "live" };
			} catch (error) {
				captureError(
					error instanceof Error
						? error
						: new Error("Failed to fetch cashflow variance"),
					{ companyId, source: "features/cashflow/useCashflow.variance" },
				);
				const projection = projectionQuery.data ?? {
					...FALLBACK_PROJECTION_BASE,
					companyId,
					__source: "fallback" as const,
				};
				const actual = actualQuery.data ?? {
					...FALLBACK_ACTUAL_BASE,
					companyId,
					period: {
						startDate: period.startKey,
						endDate: period.endKey,
					},
					__source: "fallback" as const,
				};

				return {
					...buildVarianceFallback(projection, actual),
					__source: "fallback",
				};
			}
		},
		staleTime: 60_000,
		enabled: projectionQuery.isSuccess && actualQuery.isSuccess,
	});

	const projection = projectionQuery.data ?? {
		...FALLBACK_PROJECTION_BASE,
		companyId,
		__source: "fallback" as const,
	};
	const actual = actualQuery.data ?? {
		...FALLBACK_ACTUAL_BASE,
		companyId,
		period: {
			startDate: period.startKey,
			endDate: period.endKey,
		},
		__source: "fallback" as const,
	};
	const forecast = forecastQuery.data ?? {
		...FALLBACK_FORECAST_BASE,
		companyId,
		__source: "fallback" as const,
	};
	const variance = varianceQuery.data ?? {
		...buildVarianceFallback(projection, actual),
		__source: "fallback" as const,
	};
	const liquidity = liquidityQuery.data ?? {
		totalBalance: FALLBACK_LIQUIDITY,
		__source: "fallback" as const,
	};

	const remoteTasks = useMemo(
		() => buildProjectionTasks(projection),
		[projection],
	);
	const tasks = useMemo(
		() => (remoteTasks.length > 0 ? indexTasks(remoteTasks) : FALLBACK_TASKS),
		[remoteTasks],
	);
	const defaultColumns = useMemo(
		() =>
			remoteTasks.length > 0
				? buildRemoteColumns(projection)
				: FALLBACK_COLUMN_TASK_IDS,
		[projection, remoteTasks.length],
	);
	const [columnTaskIds, setColumnTaskIds] =
		useState<Record<ColumnId, string[]>>(defaultColumns);

	useEffect(() => {
		setColumnTaskIds(defaultColumns);
	}, [defaultColumns]);

	const data = useMemo(
		() => buildBoardState(tasks, columnTaskIds),
		[tasks, columnTaskIds],
	);

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
		useSensor(KeyboardSensor),
	);

	const onDragStart = (event: DragStartEvent) => {
		const taskId = String(event.active.id);
		setActiveTask(tasks[taskId] ?? null);
	};

	const onDragEnd = (event: DragEndEvent) => {
		setActiveTask(null);
		const { active, over } = event;
		if (!over) return;

		const activeId = String(active.id);
		const overId = String(over.id);
		const sourceColumn = findColumnForTask(columnTaskIds, activeId);
		if (!sourceColumn) return;

		const targetColumn =
			overId in COLUMN_TITLES
				? (overId as ColumnId)
				: findColumnForTask(columnTaskIds, overId);
		if (!targetColumn || sourceColumn === targetColumn) return;

		setColumnTaskIds((current) => ({
			...current,
			[sourceColumn]: current[sourceColumn].filter(
				(taskId) => taskId !== activeId,
			),
			[targetColumn]: [...current[targetColumn], activeId],
		}));
	};

	const stats = useMemo<CashflowHookStats>(
		() => ({
			totalCash: liquidity.totalBalance,
			incomePending: projection.summary.totalInflows,
			expensePending: projection.summary.totalOutflows,
			actualInflows: actual.actualInflows,
			actualOutflows: actual.actualOutflows,
			projectedNet: projection.summary.netCashflow,
			varianceNet: variance.variance.netCashflow,
			nextForecastNet: forecast.forecast[0]?.netCashflow ?? 0,
		}),
		[
			actual.actualInflows,
			actual.actualOutflows,
			forecast.forecast,
			liquidity.totalBalance,
			projection.summary.netCashflow,
			projection.summary.totalInflows,
			projection.summary.totalOutflows,
			variance.variance.netCashflow,
		],
	);

	return {
		data,
		viewMode,
		setViewMode,
		activeTask,
		sensors,
		onDragStart,
		onDragEnd,
		stats,
		actual,
		projection,
		forecast,
		variance,
		isLoading:
			projectionQuery.isLoading ||
			actualQuery.isLoading ||
			forecastQuery.isLoading ||
			varianceQuery.isLoading ||
			liquidityQuery.isLoading,
		isUsingFallback:
			projection.__source === "fallback" ||
			actual.__source === "fallback" ||
			forecast.__source === "fallback" ||
			variance.__source === "fallback" ||
			liquidity.__source === "fallback",
	};
};

export { useCashflow };
