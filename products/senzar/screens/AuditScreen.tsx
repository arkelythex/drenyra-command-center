import type React from "react";
import { Icon } from "../components/Icon";
import type { AuditRecord } from "../types";

const AUDIT_DATA: AuditRecord[] = [
	{
		id: "#4023",
		lotId: "Mango Kent",
		crop: "Mango Kent",
		date: "14 Oct, 2024",
		time: "08:30 AM",
		compliance: 100,
		status: "listo",
		senasaStatus: "ok",
	},
	{
		id: "#4024",
		lotId: "Red Globe",
		crop: "Red Globe",
		date: "14 Oct, 2024",
		time: "10:15 AM",
		compliance: 85,
		status: "falta-firma",
		senasaStatus: "pendiente",
	},
	{
		id: "#4025",
		lotId: "Mango Edward",
		crop: "Mango Edward",
		date: "13 Oct, 2024",
		time: "04:45 PM",
		compliance: 90,
		status: "falta-foto",
		senasaStatus: "pendiente",
	},
	{
		id: "#4022",
		lotId: "Mango Kent",
		crop: "Mango Kent",
		date: "13 Oct, 2024",
		time: "02:20 PM",
		compliance: 100,
		status: "listo",
		senasaStatus: "ok",
	},
];

export const AuditScreen: React.FC = () => {
	return (
		<div className="flex flex-1 overflow-hidden h-full relative">
			{/* Scrollable Content Area */}
			<div className="flex-1 overflow-y-auto p-6 md:p-8 bg-gray-50">
				<div className="max-w-[1200px] mx-auto flex flex-col gap-6">
					{/* KPI Stats */}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
						<div className="p-5 rounded-xl bg-white border border-gray-200 shadow-sm flex flex-col gap-1">
							<span className="text-sm font-medium text-slate-500">
								Lotes Listos
							</span>
							<div className="flex items-end gap-2">
								<span className="text-3xl font-bold text-slate-900">12</span>
								<span className="text-xs font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded mb-1">
									+2 hoy
								</span>
							</div>
						</div>
						<div className="p-5 rounded-xl bg-white border border-gray-200 shadow-sm flex flex-col gap-1">
							<span className="text-sm font-medium text-slate-500">
								Pendientes de Firma
							</span>
							<div className="flex items-end gap-2">
								<span className="text-3xl font-bold text-slate-900">3</span>
								<span className="text-xs font-medium text-alert bg-alert/10 px-1.5 py-0.5 rounded mb-1">
									Requiere atención
								</span>
							</div>
						</div>
						<div className="p-5 rounded-xl bg-white border border-gray-200 shadow-sm flex flex-col gap-1">
							<span className="text-sm font-medium text-slate-500">
								Falta Foto
							</span>
							<div className="flex items-end gap-2">
								<span className="text-3xl font-bold text-slate-900">2</span>
								<span className="text-xs font-medium text-alert bg-alert/10 px-1.5 py-0.5 rounded mb-1">
									Incompletos
								</span>
							</div>
						</div>
						<div className="p-5 rounded-xl bg-white border border-gray-200 shadow-sm flex flex-col gap-1">
							<span className="text-sm font-medium text-slate-500">
								Cumplimiento Promedio
							</span>
							<div className="flex items-end gap-2">
								<span className="text-3xl font-bold text-slate-900">94%</span>
								<span className="text-xs font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded mb-1">
									+2%
								</span>
							</div>
						</div>
					</div>

					{/* Filters & Actions */}
					<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
						<div className="w-full sm:w-auto flex-1 max-w-md relative">
							<span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
								<Icon name="search" />
							</span>
							<input
								className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-gray-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
								placeholder="Buscar por ID de lote, cultivo o productor..."
								type="text"
							/>
						</div>
						<div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
							<button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-white text-sm font-medium whitespace-nowrap shadow-sm hover:bg-primary-dark transition-colors">
								<Icon name="filter_list" className="text-[18px]" />
								Todos
							</button>
							<button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 text-slate-600 text-sm font-medium whitespace-nowrap hover:bg-slate-200 transition-colors">
								<Icon name="verified" className="text-[18px]" />
								Listos para Exportar
							</button>
							<button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 text-slate-600 text-sm font-medium whitespace-nowrap hover:bg-slate-200 transition-colors">
								<Icon
									name="warning"
									className="text-[18px] text-alert"
									filled
								/>
								Alertas
							</button>
						</div>
					</div>

					{/* Main Data Grid / List */}
					<div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
						<div className="overflow-x-auto">
							<table className="w-full text-left border-collapse">
								<thead>
									<tr className="bg-slate-50 border-b border-gray-200">
										<th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500">
											Lote & Cultivo
										</th>
										<th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500">
											Fecha Cosecha
										</th>
										<th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 w-1/3">
											Score de Cumplimiento
										</th>
										<th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500">
											Estado
										</th>
										<th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">
											Acciones
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100">
									{AUDIT_DATA.map((row) => (
										<tr
											key={row.id}
											className="group hover:bg-slate-50 transition-colors"
										>
											<td className="py-4 px-6">
												<div className="flex items-center gap-3">
													<div
														className={`h-10 w-10 rounded-lg flex items-center justify-center ${row.id === "#4024" ? "bg-purple-100 text-purple-600" : "bg-orange-100 text-orange-600"}`}
													>
														<Icon
															name={
																row.id === "#4024" ? "dataset" : "nutrition"
															}
														/>
													</div>
													<div>
														<p className="font-semibold text-slate-900 text-sm">
															{row.id}
														</p>
														<p className="text-xs text-slate-500">{row.crop}</p>
													</div>
												</div>
											</td>
											<td className="py-4 px-6">
												<p className="text-sm text-slate-700">{row.date}</p>
												<p className="text-xs text-slate-500">{row.time}</p>
											</td>
											<td className="py-4 px-6">
												<div className="flex flex-col gap-2">
													<div className="flex justify-between items-center text-xs">
														<span
															className={`font-medium ${row.compliance < 100 ? "text-alert" : "text-primary"}`}
														>
															{row.compliance}%{" "}
															{row.compliance < 100
																? "Incompleto"
																: "Cumplimiento"}
														</span>
														<span
															className={`flex items-center gap-1 ${row.compliance < 100 ? "text-alert" : "text-primary"}`}
														>
															<Icon
																name={
																	row.status === "falta-firma"
																		? "draw"
																		: row.status === "falta-foto"
																			? "add_a_photo"
																			: "verified_user"
																}
																className="text-[16px]"
															/>
															{row.status === "listo"
																? "SENASA OK"
																: row.status === "falta-firma"
																	? "Falta Firma"
																	: "Falta Evidencia"}
														</span>
													</div>
													<div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
														<div
															className={`h-full rounded-full ${row.compliance < 100 ? "bg-alert" : "bg-primary"}`}
															style={{ width: `${row.compliance}%` }}
														></div>
													</div>
												</div>
											</td>
											<td className="py-4 px-6">
												<span
													className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
														row.status === "listo"
															? "bg-green-100 text-green-700 border-green-200"
															: "bg-alert/10 text-alert border-alert/20"
													}`}
												>
													{row.status === "listo" ? (
														<>
															<span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
															Listo
														</>
													) : (
														<>
															<Icon
																name={
																	row.status === "falta-firma"
																		? "priority_high"
																		: "photo_camera"
																}
																className="text-[14px]"
															/>
															{row.status === "falta-firma"
																? "Falta Firma Ing."
																: "Falta Foto"}
														</>
													)}
												</span>
											</td>
											<td className="py-4 px-6 text-right">
												{row.status !== "listo" && (
													<button className="text-functional-blue hover:text-blue-700 font-medium text-sm mr-2 hover:underline">
														{row.status === "falta-firma" ? "Firmar" : "Subir"}
													</button>
												)}
												<button className="text-slate-400 hover:text-primary transition-colors p-2 rounded-lg hover:bg-slate-100">
													<Icon name="more_vert" />
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
						{/* Pagination */}
						<div className="bg-slate-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
							<span className="text-sm text-slate-500">
								Mostrando 1-4 de 12 lotes
							</span>
							<div className="flex gap-2">
								<button className="px-3 py-1 rounded border border-gray-300 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-50">
									Anterior
								</button>
								<button className="px-3 py-1 rounded border border-gray-300 text-sm text-slate-600 hover:bg-slate-100">
									Siguiente
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Right Drawer Preview */}
			<aside className="w-[380px] hidden xl:flex flex-col border-l border-gray-200 bg-white shadow-xl z-20 h-full">
				<div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
					<h3 className="font-semibold text-slate-800">Vista Previa Reporte</h3>
					<button className="text-slate-400 hover:text-slate-600">
						<Icon name="close" />
					</button>
				</div>
				<div className="flex-1 overflow-y-auto p-6 bg-slate-100">
					{/* Document Preview Card */}
					<div className="bg-white text-slate-800 p-8 shadow-sm rounded-sm min-h-[500px] flex flex-col gap-4 text-[10px] leading-relaxed relative border border-gray-200">
						{/* Watermark */}
						<div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
							<Icon name="verified" className="text-[200px]" />
						</div>
						<div className="flex justify-between items-start border-b border-gray-200 pb-4">
							<div className="font-bold text-xs uppercase">
								Reporte Técnico
								<br />
								AgroExport SAC
							</div>
							<div className="text-right">
								Ref: #4023
								<br />
								14/10/2024
							</div>
						</div>
						<div className="space-y-2">
							<div className="font-bold bg-slate-100 p-1">
								1. Datos del Lote
							</div>
							<div className="grid grid-cols-2 gap-2">
								<div>
									Producto: <span className="font-medium">Mango Kent</span>
								</div>
								<div>
									Origen: <span className="font-medium">Piura, Zona A</span>
								</div>
								<div>
									Peso Neto: <span className="font-medium">1,240 kg</span>
								</div>
								<div>
									Cajas: <span className="font-medium">310</span>
								</div>
							</div>
						</div>
						<div className="space-y-2 mt-2">
							<div className="font-bold bg-slate-100 p-1">
								2. Auditoría SENASA
							</div>
							<div className="flex items-center gap-2 text-green-700">
								<Icon name="check_circle" className="text-[14px]" />
								<span>Certificado Fitosanitario: Aprobado</span>
							</div>
							<div className="flex items-center gap-2 text-green-700">
								<Icon name="check_circle" className="text-[14px]" />
								<span>Límite Máximo de Residuos (LMR): Conforme</span>
							</div>
						</div>
						<div className="space-y-2 mt-2">
							<div className="font-bold bg-slate-100 p-1">
								3. Firmas Autorizadas
							</div>
							<div className="h-16 border border-dashed border-gray-300 rounded flex items-center justify-center text-slate-400">
								Firma Digital: Ing. Carlos M.
							</div>
						</div>
						<div className="mt-auto pt-4 border-t border-gray-200 text-center text-slate-400">
							Generado automáticamente por VUCE Console v2.4
						</div>
					</div>
				</div>
				<div className="p-4 border-t border-gray-200 bg-white">
					<button className="w-full py-2.5 bg-slate-900 text-white rounded-lg font-medium text-sm hover:opacity-90 transition-opacity shadow-lg">
						Descargar PDF Completo
					</button>
				</div>
			</aside>
		</div>
	);
};
