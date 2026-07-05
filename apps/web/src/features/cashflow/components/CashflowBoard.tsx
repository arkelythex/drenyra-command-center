"use client";

import { closestCenter, DndContext, DragOverlay } from "@dnd-kit/core";
import { useState } from "react";
import { entranceVariants, MotionDiv } from "@/components/ui/motion-primitives";
import { useDesignTokens } from "@/lib/design-tokens";
import { n } from "@/lib/utils";
import { useSidebarLayout } from "@/stores/sidebar-layout.store";
import { useCashflow } from "../hooks/useCashflow";
import { CashflowBoardColumn } from "./cashflow-board/CashflowBoardColumn";
import { CashflowBoardHeader } from "./cashflow-board/CashflowBoardHeader";
import { CashflowForecastView } from "./cashflow-board/CashflowForecastView";
import { CashflowMetricsGrid } from "./cashflow-board/CashflowMetricsGrid";
import { CashflowCard } from "./widgets/CashflowCard";

export function CashflowBoard(): JSX.Element {
	const {
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
		isLoading,
		isUsingFallback,
	} = useCashflow();
	const { setIsMobileOpen } = useSidebarLayout();
	const { shadows, zIndex, backdropBlur, borderRadius } = useDesignTokens();
	const [searchQuery, setSearchQuery] = useState("");
	const activeTab = viewMode === "forecast" ? "prevision" : "tablero";

	function handleMobileTabChange(id: string): void {
		if (id === "tablero") {
			setViewMode("board");
			return;
		}

		if (id === "prevision") {
			setViewMode("forecast");
		}
	}

	const formatMoney = n;

	function formatPercentage(value: number): string {
		return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
	}

	return (
		<div className="relative flex h-full flex-col overflow-hidden bg-background font-sans text-foreground">
			<CashflowBoardHeader
				activeTab={activeTab}
				searchQuery={searchQuery}
				onSearchChange={setSearchQuery}
				onTabChange={handleMobileTabChange}
				onOpenMobileSidebar={() => setIsMobileOpen(true)}
				onSetBoardView={() => setViewMode("board")}
				onSetForecastView={() => setViewMode("forecast")}
				totalCashLabel={formatMoney(stats.totalCash)}
				isUsingFallback={isUsingFallback}
				isLoading={isLoading}
				viewMode={viewMode}
				modalBackdropClassName={backdropBlur.modal}
				glassBackdropClassName={backdropBlur.glass}
				iconBorderRadius={borderRadius.icon}
				stickyZIndex={zIndex.sticky}
			/>

			<div className="custom-scrollbar flex-1 overflow-x-auto overflow-y-auto bg-background p-6 md:p-8 lg:p-10">
				<MotionDiv
					variants={entranceVariants}
					initial="hidden"
					animate="visible"
					className="h-full w-full"
				>
					<CashflowMetricsGrid
						actualNetCashflow={actual.netCashflow}
						actualInflows={stats.actualInflows}
						actualOutflows={stats.actualOutflows}
						projectedNet={stats.projectedNet}
						incomePending={stats.incomePending}
						expensePending={stats.expensePending}
						varianceNet={stats.varianceNet}
						netPercentage={variance.variance.netPercentage}
						nextForecastNet={stats.nextForecastNet}
						basedOnMonths={forecast.basedOnMonths}
						formatMoney={formatMoney}
						formatPercentage={formatPercentage}
					/>

					{viewMode === "board" ? (
						<DndContext
							sensors={sensors}
							collisionDetection={closestCenter}
							onDragStart={onDragStart}
							onDragEnd={onDragEnd}
						>
							<div className="flex h-full items-start justify-start gap-6 pb-20 lg:gap-8">
								{data.columnOrder.map((columnId) => {
									const column =
										data.columns[columnId as keyof typeof data.columns];
									const tasks = column.taskIds
										.map((taskId) => data.tasks[taskId])
										.filter(
											(task): task is (typeof data.tasks)[string] =>
												task !== undefined &&
												(!searchQuery.trim() ||
													task.title
														.toLowerCase()
														.includes(searchQuery.toLowerCase()) ||
													task.date
														.toLowerCase()
														.includes(searchQuery.toLowerCase())),
										);

									return (
										<CashflowBoardColumn
											key={column.id}
											column={column}
											tasks={tasks}
											formatMoney={formatMoney}
											dynamicShadow={shadows.dynamic}
											glassClassName={backdropBlur.glass}
											baseZIndex={zIndex.base}
										/>
									);
								})}
							</div>

							<DragOverlay>
								{activeTask ? (
									<div className="rotate-3 scale-105 opacity-80">
										<CashflowCard task={activeTask} index={0} />
									</div>
								) : null}
							</DragOverlay>
						</DndContext>
					) : (
						<CashflowForecastView
							actual={actual}
							projection={projection}
							forecast={forecast}
							variance={variance}
							formatMoney={formatMoney}
							formatPercentage={formatPercentage}
							glassClassName={backdropBlur.glass}
						/>
					)}
				</MotionDiv>
			</div>
		</div>
	);
}
