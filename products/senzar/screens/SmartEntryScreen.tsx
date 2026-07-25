import type React from "react";
import { useState } from "react";
import { Icon } from "../components/Icon";

interface SmartEntryScreenProps {
	onBack: () => void;
}

export const SmartEntryScreen: React.FC<SmartEntryScreenProps> = ({
	onBack,
}) => {
	const [dosage, setDosage] = useState(2.5);

	return (
		<div className="flex flex-col min-h-screen bg-background-light">
			{/* Top Navigation Bar */}
			<header className="bg-white border-b border-gray-200 sticky top-0 z-50">
				<div className="px-4 md:px-8 py-4 flex items-center justify-between max-w-7xl mx-auto w-full">
					<div
						className="flex items-center gap-4 cursor-pointer"
						onClick={onBack}
					>
						<div className="bg-primary/10 p-2 rounded-lg text-primary">
							<Icon name="agriculture" className="text-3xl" />
						</div>
						<div>
							<h1 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900 leading-none">
								Smart Entry
							</h1>
							<p className="text-sm text-gray-500 font-medium mt-1">
								Registro Fitosanitario
							</p>
						</div>
					</div>
					<div className="flex items-center gap-4 md:gap-6">
						<div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full border border-green-200">
							<Icon name="wifi_off" className="text-[20px] filled" />
							<span className="text-sm font-semibold">Modo Offline Activo</span>
						</div>
						<div className="flex items-center gap-3 pl-6 border-l border-gray-200">
							<div className="text-right hidden sm:block">
								<p className="text-sm font-bold text-gray-900">Carlos M.</p>
								<p className="text-xs text-gray-500">Supervisor de Campo</p>
							</div>
							<div
								className="h-10 w-10 rounded-full bg-cover bg-center border-2 border-primary"
								style={{
									backgroundImage: "url('https://picsum.photos/100/100')",
								}}
							></div>
						</div>
					</div>
				</div>
			</header>

			<main className="flex-grow flex flex-col items-center py-6 px-4 md:px-8 max-w-7xl mx-auto w-full">
				{/* Stepper Navigation */}
				<div className="w-full max-w-4xl mb-8">
					<div className="relative flex items-center justify-between w-full">
						<div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full -z-10"></div>
						<div className="absolute left-0 top-1/2 -translate-y-1/2 w-1/2 h-1 bg-primary rounded-full -z-10 transition-all duration-500"></div>

						<div className="flex flex-col items-center group cursor-pointer">
							<div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-primary text-white font-bold text-lg md:text-xl shadow-md border-4 border-white">
								<Icon name="check" />
							</div>
							<span className="mt-2 text-sm md:text-base font-semibold text-primary">
								Identificación
							</span>
						</div>

						<div className="flex flex-col items-center">
							<div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-primary text-white font-bold text-lg md:text-xl shadow-lg ring-4 ring-primary/20 border-4 border-white">
								2
							</div>
							<span className="mt-2 text-sm md:text-base font-bold text-gray-900">
								Actividad
							</span>
						</div>

						<div className="flex flex-col items-center">
							<div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-gray-200 text-gray-500 font-bold text-lg md:text-xl border-4 border-white">
								3
							</div>
							<span className="mt-2 text-sm md:text-base font-medium text-gray-500">
								Evidencia
							</span>
						</div>
					</div>
				</div>

				{/* Main Form Area */}
				<div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
					{/* Context/Summary Card */}
					<div className="lg:col-span-4 flex flex-col gap-4">
						<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
							<h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2">
								<Icon name="info" className="text-lg" />
								Resumen del Lote
							</h3>
							<div className="space-y-4">
								<div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
									<span className="text-xs text-gray-500 block mb-1">
										Código de Lote
									</span>
									<span className="text-lg font-bold text-gray-900 flex items-center gap-2">
										L-204-NORTE
										<Icon name="verified" className="text-green-600 text-lg" />
									</span>
								</div>
								<div className="grid grid-cols-2 gap-3">
									<div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
										<span className="text-xs text-gray-500 block mb-1">
											Cultivo
										</span>
										<span className="font-bold text-gray-900 flex items-center gap-1">
											<Icon
												name="nutrition"
												className="text-orange-500 text-sm"
											/>
											Mango
										</span>
									</div>
									<div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
										<span className="text-xs text-gray-500 block mb-1">
											Área
										</span>
										<span className="font-bold text-gray-900">2.5 Ha</span>
									</div>
								</div>
								<div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
									<div className="flex items-center gap-2 mb-1">
										<Icon name="cloud" className="text-blue-600 text-sm" />
										<span className="text-xs font-bold text-blue-700">
											Clima Actual
										</span>
									</div>
									<span className="text-sm text-blue-900">
										Soleado, 28°C. Viento NE 12km/h
									</span>
								</div>
							</div>
						</div>

						<div className="bg-green-50 rounded-xl p-4 border border-green-100 flex items-center justify-between">
							<div>
								<p className="text-xs font-bold text-green-700 uppercase">
									Paso 1 Completado
								</p>
								<p className="text-sm text-green-900 font-medium">
									Identificación validada
								</p>
							</div>
							<div className="h-8 w-8 rounded-full bg-green-200 flex items-center justify-center text-green-700">
								<Icon name="qr_code_scanner" className="text-lg" />
							</div>
						</div>
					</div>

					{/* Active Form Step */}
					<div className="lg:col-span-8 flex flex-col gap-6">
						<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
							<div className="flex items-center justify-between mb-6">
								<h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
									<span className="flex items-center justify-center w-8 h-8 rounded bg-primary/20 text-primary text-sm font-bold">
										02
									</span>
									Detalles de Aplicación
								</h2>
								<span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded text-gray-500">
									Formulario Inteligente
								</span>
							</div>
							<form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
								<div className="space-y-2">
									<label className="block text-base font-bold text-gray-700">
										Producto / Insumo
									</label>
									<div className="relative group">
										<div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
											<Icon
												name="science"
												className="text-gray-400 group-focus-within:text-primary transition-colors"
											/>
										</div>
										<input
											className="block w-full pl-12 pr-12 py-4 bg-gray-50 border-2 border-gray-200 rounded-lg text-lg text-gray-900 placeholder-gray-400 focus:border-primary focus:ring-0 focus:outline-none transition-colors"
											placeholder="Buscar insumo (ej. Sulfato de Cobre)..."
											type="text"
											defaultValue="Fertilizante Foliar Premium X"
										/>
										<div className="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer">
											<Icon
												name="close"
												className="text-gray-400 hover:text-gray-600"
											/>
										</div>
									</div>
									<div className="flex flex-wrap gap-2 mt-2">
										{["Urea 46%", "Sulfato K", "Nitrato Mg"].map((item) => (
											<button
												key={item}
												className="text-xs font-medium px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"
												type="button"
											>
												{item}
											</button>
										))}
									</div>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
									<div className="space-y-2">
										<label className="block text-base font-bold text-gray-700">
											Dosis (L/ha)
										</label>
										<div className="flex items-center">
											<button
												onClick={() => setDosage(Math.max(0, dosage - 0.5))}
												className="w-14 h-14 rounded-l-lg bg-gray-100 hover:bg-gray-200 border-y-2 border-l-2 border-gray-200 flex items-center justify-center transition-colors"
												type="button"
											>
												<Icon name="remove" className="text-2xl font-bold" />
											</button>
											<input
												className="block w-full h-14 text-center bg-white border-2 border-gray-200 text-2xl font-bold text-gray-900 focus:border-primary focus:ring-0 z-10 focus:outline-none"
												type="number"
												value={dosage}
												onChange={(e) => setDosage(parseFloat(e.target.value))}
											/>
											<button
												onClick={() => setDosage(dosage + 0.5)}
												className="w-14 h-14 rounded-r-lg bg-gray-100 hover:bg-gray-200 border-y-2 border-r-2 border-gray-200 flex items-center justify-center transition-colors"
												type="button"
											>
												<Icon name="add" className="text-2xl font-bold" />
											</button>
										</div>
									</div>

									<div className="space-y-2">
										<label className="block text-base font-bold text-gray-700">
											Volumen de Agua (L)
										</label>
										<div className="relative">
											<div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
												<Icon
													name="water_drop"
													className="text-blue-400"
													filled
												/>
											</div>
											<input
												className="block w-full pl-12 pr-4 h-14 bg-white border-2 border-gray-200 rounded-lg text-2xl font-bold text-gray-900 focus:border-primary focus:ring-0 focus:outline-none"
												placeholder="0"
												type="number"
											/>
										</div>
									</div>
								</div>

								<div className="pt-4 border-t border-gray-100 space-y-4">
									<h4 className="text-sm font-bold uppercase text-gray-500 tracking-wider">
										Verificaciones de Seguridad
									</h4>
									<label className="flex items-center p-4 rounded-lg border-2 border-gray-200 bg-gray-50 cursor-pointer hover:border-primary/50 transition-colors">
										<div className="relative flex items-center">
											<input
												defaultChecked
												className="w-6 h-6 rounded border-gray-300 text-primary focus:ring-primary/50 bg-white"
												type="checkbox"
											/>
										</div>
										<div className="ml-4 flex-1">
											<span className="block text-base font-bold text-gray-900">
												Equipo de Protección Personal (EPP)
											</span>
											<span className="block text-sm text-gray-500">
												Operario cuenta con mascarilla y guantes
											</span>
										</div>
										<Icon
											name="health_and_safety"
											className="text-green-600 text-2xl filled"
										/>
									</label>
									<label className="flex items-center p-4 rounded-lg border-2 border-gray-200 bg-gray-50 cursor-pointer hover:border-primary/50 transition-colors">
										<div className="relative flex items-center">
											<input
												className="w-6 h-6 rounded border-gray-300 text-primary focus:ring-primary/50 bg-white"
												type="checkbox"
											/>
										</div>
										<div className="ml-4 flex-1">
											<span className="block text-base font-bold text-gray-900">
												Maquinaria Calibrada
											</span>
											<span className="block text-sm text-gray-500">
												Boquillas revisadas antes de aplicar
											</span>
										</div>
										<Icon
											name="settings_input_component"
											className="text-gray-400 text-2xl"
										/>
									</label>
								</div>
							</form>
						</div>
					</div>
				</div>
			</main>

			<footer className="sticky bottom-0 z-50 bg-white/90 backdrop-blur border-t border-gray-200 pb-safe pt-4">
				<div className="px-4 md:px-8 pb-4 max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
					<button
						onClick={onBack}
						className="flex items-center justify-center gap-2 h-12 md:h-14 px-6 md:px-8 rounded-lg border-2 border-gray-300 bg-transparent text-gray-700 font-bold hover:bg-gray-50 transition-colors"
					>
						<Icon name="arrow_back" />
						<span className="hidden sm:inline">Anterior</span>
					</button>
					<div className="flex items-center gap-4 flex-1 justify-end">
						<span className="text-xs text-gray-400 hidden sm:inline-block">
							Guardado localmente hace 2 min
						</span>
						<button className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-12 md:h-14 px-8 md:px-10 bg-primary hover:bg-primary-dark text-white rounded-lg shadow-lg shadow-primary/30 font-bold text-lg transition-all transform hover:scale-[1.01]">
							<span>Siguiente</span>
							<Icon name="arrow_forward" />
						</button>
					</div>
				</div>
			</footer>
		</div>
	);
};
