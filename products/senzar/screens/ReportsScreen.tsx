import type React from "react";
import { Icon } from "../components/Icon";

export const ReportsScreen: React.FC = () => {
	return (
		<div className="flex flex-1 flex-col overflow-hidden bg-gray-50 h-full p-6 md:p-8">
			<div className="max-w-6xl mx-auto w-full flex flex-col gap-8">
				{/* Header Section */}
				<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
					<div>
						<h2 className="text-3xl font-bold text-gray-900 tracking-tight">
							Reportes SENASA
						</h2>
						<p className="text-gray-500 mt-1">
							Gestión de certificados fitosanitarios y documentos de
							exportación.
						</p>
					</div>
					<button className="flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20">
						<Icon name="add_circle" />
						Nuevo Certificado
					</button>
				</div>

				{/* Templates Grid */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					<div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
						<div className="w-12 h-12 rounded-lg bg-green-50 text-green-600 flex items-center justify-center mb-4 group-hover:bg-green-100 transition-colors">
							<Icon name="eco" className="text-2xl" filled />
						</div>
						<h3 className="text-lg font-bold text-gray-900">
							Certificado Fitosanitario
						</h3>
						<p className="text-sm text-gray-500 mt-2 mb-4">
							Para exportación de productos vegetales frescos. Requiere
							inspección.
						</p>
						<span className="text-xs font-bold text-primary flex items-center group-hover:underline">
							Iniciar Trámite{" "}
							<Icon name="arrow_forward" className="text-sm ml-1" />
						</span>
					</div>

					<div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
						<div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
							<Icon name="location_on" className="text-2xl" filled />
						</div>
						<h3 className="text-lg font-bold text-gray-900">
							Certificado de Origen
						</h3>
						<p className="text-sm text-gray-500 mt-2 mb-4">
							Acredita la procedencia de la mercancía para beneficios
							arancelarios.
						</p>
						<span className="text-xs font-bold text-blue-600 flex items-center group-hover:underline">
							Iniciar Trámite{" "}
							<Icon name="arrow_forward" className="text-sm ml-1" />
						</span>
					</div>

					<div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
						<div className="w-12 h-12 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center mb-4 group-hover:bg-orange-100 transition-colors">
							<Icon name="bug_report" className="text-2xl" filled />
						</div>
						<h3 className="text-lg font-bold text-gray-900">
							Reporte de Inspección
						</h3>
						<p className="text-sm text-gray-500 mt-2 mb-4">
							Registro interno de hallazgos de plagas y tratamientos aplicados.
						</p>
						<span className="text-xs font-bold text-orange-600 flex items-center group-hover:underline">
							Ver Historial{" "}
							<Icon name="arrow_forward" className="text-sm ml-1" />
						</span>
					</div>
				</div>

				{/* Recent Documents Table */}
				<div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex-1 flex flex-col">
					<div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
						<h3 className="font-bold text-gray-800">Documentos Recientes</h3>
						<div className="flex gap-2">
							<select className="text-sm border-gray-300 rounded-md bg-white py-1 pl-2 pr-8 focus:ring-primary focus:border-primary">
								<option>Últimos 30 días</option>
								<option>Este mes</option>
							</select>
							<button className="p-1 text-gray-500 hover:text-gray-700">
								<Icon name="refresh" />
							</button>
						</div>
					</div>
					<div className="overflow-x-auto">
						<table className="w-full text-left border-collapse">
							<thead>
								<tr className="bg-white border-b border-gray-100 text-xs text-gray-500 uppercase">
									<th className="px-6 py-3 font-semibold">ID Documento</th>
									<th className="px-6 py-3 font-semibold">Tipo</th>
									<th className="px-6 py-3 font-semibold">Fecha</th>
									<th className="px-6 py-3 font-semibold">Estado VUCE</th>
									<th className="px-6 py-3 font-semibold text-right">Acción</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-100 text-sm">
								{[
									{
										id: "EXP-2024-001",
										type: "Certificado Fitosanitario",
										date: "14 Oct 2024",
										status: "approved",
									},
									{
										id: "EXP-2024-002",
										type: "Certificado de Origen",
										date: "13 Oct 2024",
										status: "pending",
									},
									{
										id: "INT-2024-089",
										type: "Reporte Inspección",
										date: "12 Oct 2024",
										status: "approved",
									},
									{
										id: "EXP-2024-003",
										type: "Certificado Fitosanitario",
										date: "10 Oct 2024",
										status: "rejected",
									},
								].map((doc) => (
									<tr
										key={doc.id}
										className="hover:bg-gray-50 transition-colors"
									>
										<td className="px-6 py-4 font-medium text-gray-900">
											{doc.id}
										</td>
										<td className="px-6 py-4 text-gray-600">{doc.type}</td>
										<td className="px-6 py-4 text-gray-500">{doc.date}</td>
										<td className="px-6 py-4">
											{doc.status === "approved" && (
												<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
													<span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>{" "}
													Aprobado
												</span>
											)}
											{doc.status === "pending" && (
												<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">
													<span className="w-1.5 h-1.5 rounded-full bg-yellow-600 animate-pulse"></span>{" "}
													En Trámite
												</span>
											)}
											{doc.status === "rejected" && (
												<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
													<span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>{" "}
													Observado
												</span>
											)}
										</td>
										<td className="px-6 py-4 text-right">
											<button className="text-primary font-bold hover:underline">
												Ver PDF
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	);
};
