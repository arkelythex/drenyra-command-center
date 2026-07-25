import type React from "react";
import { Icon } from "../components/Icon";

export const LogisticsScreen: React.FC = () => {
	return (
		<div className="flex flex-1 flex-col lg:flex-row overflow-hidden bg-gray-50 h-full">
			{/* Left List Panel */}
			<div className="w-full lg:w-[400px] flex-none bg-white border-r border-gray-200 flex flex-col h-full z-10 shadow-sm">
				<div className="p-6 border-b border-gray-200">
					<h2 className="text-2xl font-bold text-gray-900">Flota Activa</h2>
					<div className="flex gap-4 mt-4">
						<div className="flex-1 bg-blue-50 p-3 rounded-lg border border-blue-100">
							<span className="block text-2xl font-bold text-blue-700">8</span>
							<span className="text-xs text-blue-600 font-medium">En Ruta</span>
						</div>
						<div className="flex-1 bg-green-50 p-3 rounded-lg border border-green-100">
							<span className="block text-2xl font-bold text-green-700">3</span>
							<span className="text-xs text-green-600 font-medium">
								En Planta
							</span>
						</div>
						<div className="flex-1 bg-orange-50 p-3 rounded-lg border border-orange-100">
							<span className="block text-2xl font-bold text-orange-700">
								1
							</span>
							<span className="text-xs text-orange-600 font-medium">
								Retrasado
							</span>
						</div>
					</div>
					<div className="mt-4 relative">
						<Icon
							name="search"
							className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
						/>
						<input
							type="text"
							placeholder="Buscar placa o conductor..."
							className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
						/>
					</div>
				</div>

				<div className="flex-1 overflow-y-auto">
					{[1, 2, 3, 4, 5].map((i) => (
						<div
							key={i}
							className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer group transition-colors ${i === 1 ? "bg-blue-50/50 border-l-4 border-l-functional-blue" : "border-l-4 border-l-transparent"}`}
						>
							<div className="flex justify-between items-start mb-2">
								<div>
									<h3 className="font-bold text-gray-900">Volvo FH-12</h3>
									<p className="text-xs text-gray-500 font-mono">
										PLACA: V1T-88{i}
									</p>
								</div>
								<span
									className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${i === 3 ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`}
								>
									{i === 3 ? "Retrasado" : "En Ruta"}
								</span>
							</div>
							<div className="flex items-center gap-4 text-xs text-gray-600 mb-2">
								<div className="flex items-center gap-1">
									<Icon name="person" className="text-[14px]" /> Carlos R.
								</div>
								<div className="flex items-center gap-1">
									<Icon name="speed" className="text-[14px]" /> 85 km/h
								</div>
							</div>
							<div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
								<div
									className="bg-functional-blue h-1.5 rounded-full"
									style={{ width: `${80 - i * 10}%` }}
								></div>
							</div>
							<div className="flex justify-between mt-1">
								<span className="text-[10px] text-gray-400">
									Origen: Fundo San José
								</span>
								<span className="text-[10px] text-gray-400">
									Destino: Puerto Paita
								</span>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Main Map Area */}
			<div className="flex-1 relative bg-gray-200 flex flex-col">
				{/* Mock Map Background */}
				<div
					className="absolute inset-0 bg-[#e5e7eb]"
					style={{
						backgroundImage: "radial-gradient(#cbd5e1 2px, transparent 2px)",
						backgroundSize: "30px 30px",
					}}
				>
					{/* Simulated Route Line */}
					<svg className="absolute inset-0 w-full h-full pointer-events-none">
						<path
							d="M 200 400 Q 400 300 600 200 T 900 150"
							fill="none"
							stroke="#2F80ED"
							strokeWidth="4"
							strokeDasharray="8 4"
							className="animate-[dash_20s_linear_infinite]"
						/>
						<circle
							cx="200"
							cy="400"
							r="8"
							fill="#6f9b69"
							stroke="white"
							strokeWidth="2"
						/>
						<circle
							cx="900"
							cy="150"
							r="8"
							fill="#F2994A"
							stroke="white"
							strokeWidth="2"
						/>
					</svg>

					{/* Truck Marker */}
					<div className="absolute top-[280px] left-[450px] transform -translate-x-1/2 -translate-y-1/2">
						<div className="relative">
							<div className="absolute -inset-4 bg-functional-blue/20 rounded-full animate-ping"></div>
							<div className="w-10 h-10 bg-functional-blue rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white z-10 relative">
								<Icon name="local_shipping" className="text-sm" />
							</div>
							<div className="absolute top-12 left-1/2 -translate-x-1/2 bg-white px-3 py-1 rounded shadow-md whitespace-nowrap z-20">
								<p className="text-xs font-bold text-gray-900">V1T-881</p>
								<p className="text-[10px] text-green-600 font-bold">
									Temperatura: 14°C
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Map Overlays */}
				<div className="absolute top-6 right-6 flex flex-col gap-2">
					<button className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center text-gray-600 hover:text-primary transition-colors">
						<Icon name="my_location" />
					</button>
					<button className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center text-gray-600 hover:text-primary transition-colors">
						<Icon name="add" />
					</button>
					<button className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center text-gray-600 hover:text-primary transition-colors">
						<Icon name="remove" />
					</button>
				</div>

				{/* Bottom Status Panel */}
				<div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur rounded-xl shadow-lg border border-gray-200 p-6">
					<div className="flex flex-col md:flex-row gap-8 items-center justify-between">
						<div className="flex items-center gap-4">
							<div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
								<Icon name="thermostat" className="text-3xl" />
							</div>
							<div>
								<p className="text-sm text-gray-500 font-medium uppercase tracking-wide">
									Cadena de Frío
								</p>
								<div className="flex items-baseline gap-2">
									<h3 className="text-3xl font-bold text-gray-900">14.2°C</h3>
									<span className="text-sm font-bold text-green-600 flex items-center">
										<Icon name="check_circle" className="text-sm mr-1" /> Óptimo
									</span>
								</div>
							</div>
						</div>

						<div className="h-10 w-px bg-gray-200 hidden md:block"></div>

						<div className="flex-1 w-full">
							<div className="flex justify-between items-end mb-2">
								<div>
									<p className="text-sm font-bold text-gray-900">
										Entrega Estimada
									</p>
									<p className="text-xs text-gray-500">
										Puerto Paita - Muelle 4
									</p>
								</div>
								<div className="text-right">
									<p className="text-xl font-bold text-functional-blue">
										14:30 PM
									</p>
									<p className="text-xs text-gray-500">En 2h 15m</p>
								</div>
							</div>
							<div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
								<div className="bg-functional-blue h-full w-[65%] rounded-full relative">
									<div className="absolute right-0 top-0 bottom-0 w-2 bg-white/50 animate-pulse"></div>
								</div>
							</div>
						</div>

						<button className="flex-none px-6 py-3 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20">
							Ver Manifiesto
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};
