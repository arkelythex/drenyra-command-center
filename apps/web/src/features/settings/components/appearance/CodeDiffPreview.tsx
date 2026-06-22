export const CodeDiffPreview = () => {
	return (
		<div className="overflow-hidden rounded-xl border border-black/5 bg-[#f8f9fa] font-mono text-xs leading-relaxed shadow-inner">
			<div className="grid grid-cols-2 divide-x divide-black/5">
				{/* Removed Side */}
				<div className="bg-[#fff5f5] py-4">
					<div className="flex px-4 opacity-30">
						<span className="w-4 shrink-0">1</span>
						<span>const themePreview: ThemeConfig = {"{"}</span>
					</div>
					<div className="flex px-4 bg-[#ffe3e3]">
						<span className="w-4 shrink-0 text-red-400">2</span>
						<span className="ml-4 text-[#c92a2a]">- surface: "sidebar",</span>
					</div>
					<div className="flex px-4 bg-[#ffe3e3]">
						<span className="w-4 shrink-0 text-red-400">3</span>
						<span className="ml-4 text-[#c92a2a]">- accent: "#2563eb",</span>
					</div>
					<div className="flex px-4 bg-[#ffe3e3]">
						<span className="w-4 shrink-0 text-red-400">4</span>
						<span className="ml-4 text-[#c92a2a]">- contrast: 42,</span>
					</div>
					<div className="flex px-4 opacity-30">
						<span className="w-4 shrink-0">5</span>
						<span>{"}"};</span>
					</div>
				</div>

				{/* Added Side */}
				<div className="bg-[#f2fdf5] py-4">
					<div className="flex px-4 opacity-30">
						<span className="w-4 shrink-0">1</span>
						<span>const themePreview: ThemeConfig = {"{"}</span>
					</div>
					<div className="flex px-4 bg-[#e6fcf5]">
						<span className="w-4 shrink-0 text-success">2</span>
						<span className="ml-4 text-[#099268]">
							+ surface: "sidebar-elevated",
						</span>
					</div>
					<div className="flex px-4 bg-[#e6fcf5]">
						<span className="w-4 shrink-0 text-success">3</span>
						<span className="ml-4 text-[#099268]">+ accent: "#0ea5e9",</span>
					</div>
					<div className="flex px-4 bg-[#e6fcf5]">
						<span className="w-4 shrink-0 text-success">4</span>
						<span className="ml-4 text-[#099268]">+ contrast: 68,</span>
					</div>
					<div className="flex px-4 opacity-30">
						<span className="w-4 shrink-0">5</span>
						<span>{"}"};</span>
					</div>
				</div>
			</div>
		</div>
	);
};
