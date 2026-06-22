import { Package, Plus, Search } from "lucide-react";
import type { Product } from "@/lib/schemas/product.schema";
import { cn, n } from "@/lib/utils";

interface ProductsGridProps {
	products: Product[];
	searchQuery: string;
	backdropClassName: string;
	hoverOverlayClassName: string;
	onSelectProduct: (product: Product) => void;
}

export function ProductsGrid({
	products,
	searchQuery,
	backdropClassName,
	hoverOverlayClassName,
	onSelectProduct,
}: ProductsGridProps) {
	return (
		<div className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-12 custom-scrollbar bg-transparent relative z-10">
			<div className="max-w-[1600px] mx-auto">
				{products.length > 0 ? (
					<div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 sm:gap-6">
						{products.map((product) => (
							<div
								key={product.id}
								onClick={() => onSelectProduct(product)}
								className={`group relative overflow-hidden rounded-3xl border border-border/60 bg-card ${backdropClassName} p-5 sm:p-6 transition-[border-color,background-color,box-shadow,transform] duration-200 hover:border-primary/20 hover:bg-card/90 hover:shadow-md cursor-pointer`}
								role="button"
								tabIndex={0}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										e.preventDefault();
										onSelectProduct(product);
									}
								}}
							>
								<div
									className={`pointer-events-none absolute inset-0 ${hoverOverlayClassName} opacity-0 transition-opacity duration-200 group-hover:opacity-100`}
								/>

								<div className="absolute right-5 top-5 z-20">
									<span
										className={`rounded-full border border-border/70 bg-muted/40 px-2.5 py-1 text-label font-semibold tracking-wide text-muted-foreground ${backdropClassName} transition-colors duration-200 group-hover:border-primary/20 group-hover:text-primary`}
									>
										{product.sku}
									</span>
								</div>

								<div className="relative z-10 space-y-5">
									<div>
										<h3 className="mb-2 pr-16 text-lg font-semibold tracking-tight text-foreground transition-colors duration-200 group-hover:text-primary sm:text-xl">
											{product.name}
										</h3>
										{product.description ? (
											<p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
												{product.description}
											</p>
										) : null}
									</div>

									<div className="flex items-center gap-2">
										{product.category ? (
											<span className="rounded-full border border-primary/15 bg-primary/8 px-2.5 py-1 text-label font-medium tracking-wide text-primary">
												{product.category}
											</span>
										) : null}
										<span className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-label font-medium tracking-wide text-muted-foreground">
											{product.unit}
										</span>
									</div>

									<div className="h-px w-full bg-border/60" />

									<div className="flex items-end justify-between">
										<div>
											<p className="mb-1 text-label font-semibold tracking-wide text-muted-foreground">
												Precio de venta
											</p>
											<p className="font-mono text-2xl font-semibold tracking-tight tabular-nums text-foreground sm:text-3xl">
												{n(product.unitPrice)}
											</p>
										</div>
										{product.costPrice ? (
											<div className="text-right">
												<p className="mb-1 text-label font-semibold tracking-wide text-muted-foreground">
													Costo
												</p>
												<p className="font-mono text-sm font-medium tabular-nums text-muted-foreground">
													{n(product.costPrice)}
												</p>
											</div>
										) : null}
									</div>

									{product.currentStock !== undefined ? (
										<div className="flex items-center justify-between pt-1">
											<span className="text-label font-semibold tracking-wide text-muted-foreground">
												Stock disponible
											</span>
											<div className="flex items-center gap-2">
												<div
													className={cn(
														"h-1.5 w-1.5 rounded-full",
														product.currentStock > (product.stockMin || 0)
															? "bg-[var(--premium-success)]"
															: "bg-red-500",
													)}
												/>
												<span
													className={cn(
														"font-mono text-sm font-semibold tracking-tight",
														product.stockMin &&
															product.currentStock < product.stockMin
															? "text-red-500 dark:text-red-400"
															: "text-[var(--premium-success)]",
													)}
												>
													{product.currentStock}{" "}
													<span className="ml-1 text-label text-muted-foreground">
														{product.unit}
													</span>
												</span>
											</div>
										</div>
									) : null}
								</div>
							</div>
						))}
					</div>
				) : (
					<div
						className={`rounded-2xl border border-dashed border-border/50 bg-card/20 py-32 text-center ${backdropClassName}`}
					>
						<div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-border/50 bg-card">
							{searchQuery ? (
								<Search
									size={32}
									className="text-muted-foreground opacity-50"
									strokeWidth={1.5}
								/>
							) : (
								<Package
									size={32}
									className="text-muted-foreground opacity-50"
									strokeWidth={1.5}
								/>
							)}
						</div>
						<p className="text-sm font-semibold text-muted-foreground">
							{searchQuery ? "Sin resultados" : "No hay productos"}
						</p>
						{!searchQuery ? (
							<div className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground">
								<Plus size={12} />
								Crea tu primer producto
							</div>
						) : null}
					</div>
				)}
			</div>
		</div>
	);
}
