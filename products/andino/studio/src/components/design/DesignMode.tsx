"use client";

import { useCallback, useState } from "react";
import { mockDesign, mockSuggestions } from "@/lib/mock-data";
import type { DroneDesign } from "@/types/drone";
import AISuggestions from "./AISuggestions";
import ComponentPalette from "./ComponentPalette";
import MetricsPanel from "./MetricsPanel";
import Viewport from "./Viewport";

export default function DesignMode() {
	const [currentDesign] = useState<DroneDesign>(mockDesign);
	const [activeTab, setActiveTab] = useState<"metrics" | "suggestions">(
		"metrics",
	);

	const handleSelectComponent = useCallback(
		(_category: string, _item: string) => {},
		[],
	);
	const handleApplySuggestion = useCallback((_index: number) => {}, []);

	return (
		<div className="max-w-7xl mx-auto px-4 py-6 flex flex-col h-[calc(100vh-52px)]">
			{/* Header */}
			<div className="flex items-center justify-between mb-4">
				<h1 className="text-xl font-bold text-text-primary">Design Mode</h1>
				<div className="flex gap-3">
					<button className="px-4 py-2 bg-accent-400 hover:bg-accent-500 text-bg-void rounded-lg text-sm font-medium transition-colors duration-200">
						New Design
					</button>
					<button className="px-4 py-2 bg-accent-400/80 hover:bg-accent-400 text-bg-void rounded-lg text-sm font-medium transition-colors duration-200">
						Evolve
					</button>
					<button className="px-4 py-2 bg-bg-surface hover:bg-bg-elevated border border-border-subtle rounded-lg text-sm font-medium transition-colors duration-200">
						Save CAD
					</button>
					<button className="px-4 py-2 bg-bg-surface hover:bg-bg-elevated border border-border-subtle rounded-lg text-sm font-medium transition-colors duration-200">
						Export STL
					</button>
				</div>
			</div>

			{/* Main Content */}
			<div className="flex gap-4 flex-1 min-h-0">
				<ComponentPalette onSelectComponent={handleSelectComponent} />
				<Viewport design={currentDesign} />

				{/* Right Panel */}
				<div className="w-[280px] flex-shrink-0 flex flex-col">
					{/* Tabs */}
					<div className="flex border-b border-border-subtle mb-3">
						<button
							onClick={() => setActiveTab("metrics")}
							className={`flex-1 pb-2 text-sm font-medium transition-colors duration-200 ${
								activeTab === "metrics"
									? "text-accent-400 border-b-2 border-accent-400"
									: "text-text-muted hover:text-text-secondary"
							}`}
						>
							Metrics
						</button>
						<button
							onClick={() => setActiveTab("suggestions")}
							className={`flex-1 pb-2 text-sm font-medium transition-colors duration-200 ${
								activeTab === "suggestions"
									? "text-accent-400 border-b-2 border-accent-400"
									: "text-text-muted hover:text-text-secondary"
							}`}
						>
							AI Suggestions
						</button>
					</div>

					{/* Tab Content */}
					<div className="flex-1 overflow-y-auto">
						{activeTab === "metrics" ? (
							<MetricsPanel design={currentDesign} />
						) : (
							<AISuggestions
								suggestions={mockSuggestions}
								onApply={handleApplySuggestion}
							/>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
