import {
	containerVariants,
	entranceVariants,
	MotionDiv,
} from "@/components/ui/motion-primitives";
import { useFinancialHaptics, useHaptics } from "@/hooks/useHaptics";
import { CreateReportCard } from "./custom-reports/CreateReportCard";
import { MOCK_REPORTS } from "./custom-reports/mock-reports";
import { ReportCard } from "./custom-reports/ReportCard";
import { ReportsHeader } from "./custom-reports/ReportsHeader";

export const CustomReportsView = () => {
	const { trigger } = useHaptics();
	const financialHaptics = useFinancialHaptics();

	return (
		<div className="flex h-full flex-col overflow-hidden bg-[var(--background)] font-sans text-foreground">
			<ReportsHeader
				onFocusSearch={() => trigger("light")}
				onOpenFilters={() => trigger("light")}
				onCreateReport={() => financialHaptics.onSubmit()}
			/>

			<div className="custom-scrollbar relative flex-1 overflow-y-auto p-6 pb-40 sm:p-10 lg:p-14">
				<div className="mx-auto max-w-[1920px]">
					<MotionDiv
						variants={containerVariants}
						initial="hidden"
						animate="visible"
						className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
					>
						{MOCK_REPORTS.map((report) => (
							<MotionDiv
								key={report.id}
								variants={entranceVariants}
								className="group flex h-[460px] flex-col"
							>
								<ReportCard
									report={report}
									onOpen={() => trigger("light")}
									onDownload={() => trigger("light")}
								/>
							</MotionDiv>
						))}
						<MotionDiv variants={entranceVariants}>
							<CreateReportCard onCreate={() => financialHaptics.onSubmit()} />
						</MotionDiv>
					</MotionDiv>
				</div>
			</div>
		</div>
	);
};
