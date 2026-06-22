import {
	Document,
	Image,
	Page,
	StyleSheet,
	Text,
	View,
} from "@react-pdf/renderer";

interface InvoicePdfItem {
	description: string;
	quantity: string | number;
	unitPrice: string | number;
	total: string | number;
}

interface InvoicePdfDocument {
	series: string;
	number: string;
	subtotal: string | number;
	tax: string | number;
	total: string | number;
	customerTaxId: string;
	customerName: string;
	customerAddress?: string;
	issueDate: string;
	dueDate: string;
	currency: string;
	items: InvoicePdfItem[];
}

const styles = StyleSheet.create({
	page: {
		padding: 30,
		fontSize: 10,
		fontFamily: "Helvetica",
	},
	header: {
		marginBottom: 20,
		borderBottom: "2 solid black",
		paddingBottom: 10,
	},
	companyName: {
		fontSize: 16,
		fontWeight: "bold",
		marginBottom: 5,
	},
	companyInfo: {
		fontSize: 9,
		color: "rgb(102, 102, 102)",
	},
	invoiceBox: {
		border: "2 solid black",
		padding: 10,
		marginBottom: 20,
	},
	invoiceTitle: {
		fontSize: 14,
		fontWeight: "bold",
		textAlign: "center",
		marginBottom: 5,
	},
	invoiceNumber: {
		fontSize: 12,
		textAlign: "center",
		fontWeight: "bold",
	},
	section: {
		marginBottom: 15,
	},
	sectionTitle: {
		fontSize: 11,
		fontWeight: "bold",
		marginBottom: 8,
		backgroundColor: "rgb(240, 240, 240)",
		padding: 5,
	},
	row: {
		flexDirection: "row",
		marginBottom: 3,
	},
	label: {
		width: "30%",
		fontWeight: "bold",
	},
	value: {
		width: "70%",
	},
	table: {
		marginTop: 10,
	},
	tableHeader: {
		flexDirection: "row",
		backgroundColor: "black",
		color: "white",
		padding: 5,
		fontWeight: "bold",
	},
	tableRow: {
		flexDirection: "row",
		borderBottom: "1 solid rgb(221, 221, 221)",
		padding: 5,
	},
	col1: { width: "10%" },
	col2: { width: "40%" },
	col3: { width: "15%" },
	col4: { width: "15%" },
	col5: { width: "20%", textAlign: "right" },
	totals: {
		marginTop: 10,
		alignItems: "flex-end",
	},
	totalRow: {
		flexDirection: "row",
		width: "40%",
		justifyContent: "space-between",
		marginBottom: 3,
	},
	totalLabel: {
		fontWeight: "bold",
	},
	grandTotal: {
		fontSize: 12,
		fontWeight: "bold",
		marginTop: 5,
		paddingTop: 5,
		borderTop: "2 solid black",
	},
	footer: {
		position: "absolute",
		bottom: 30,
		left: 30,
		right: 30,
		fontSize: 8,
		color: "rgb(102, 102, 102)",
		textAlign: "center",
	},
	qrCode: {
		width: 100,
		height: 100,
		marginTop: 10,
	},
});

interface InvoicePDFProps {
	invoice: InvoicePdfDocument;
	qrCodeDataUrl?: string;
}

export const InvoicePDF = ({ invoice, qrCodeDataUrl }: InvoicePDFProps) => {
	const subtotal = parseFloat(invoice.subtotal.toString());
	const tax = parseFloat(invoice.tax.toString());
	const total = parseFloat(invoice.total.toString());

	return (
		<Document>
			<Page size="A4" style={styles.page}>
				{/* Header */}
				<View style={styles.header}>
					<Text style={styles.companyName}>ARKELYTHEX SOLUTIONS S.A.C.</Text>
					<Text style={styles.companyInfo}>RUC: 20123456789</Text>
					<Text style={styles.companyInfo}>Av. Principal 123, Lima - Perú</Text>
					<Text style={styles.companyInfo}>Tel: +51 999 999 999</Text>
				</View>

				{/* Invoice Box */}
				<View style={styles.invoiceBox}>
					<Text style={styles.invoiceTitle}>FACTURA ELECTRÓNICA</Text>
					<Text style={styles.invoiceNumber}>
						{invoice.series}-{invoice.number}
					</Text>
				</View>

				{/* Customer Info */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>DATOS DEL CLIENTE</Text>
					<View style={styles.row}>
						<Text style={styles.label}>RUC/DNI:</Text>
						<Text style={styles.value}>{invoice.customerTaxId}</Text>
					</View>
					<View style={styles.row}>
						<Text style={styles.label}>Razón Social:</Text>
						<Text style={styles.value}>{invoice.customerName}</Text>
					</View>
					<View style={styles.row}>
						<Text style={styles.label}>Dirección:</Text>
						<Text style={styles.value}>{invoice.customerAddress || "N/A"}</Text>
					</View>
				</View>

				{/* Invoice Details */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>DETALLES DE LA FACTURA</Text>
					<View style={styles.row}>
						<Text style={styles.label}>Fecha Emisión:</Text>
						<Text style={styles.value}>
							{new Date(invoice.issueDate).toLocaleDateString("es-PE")}
						</Text>
					</View>
					<View style={styles.row}>
						<Text style={styles.label}>Fecha Vencimiento:</Text>
						<Text style={styles.value}>
							{new Date(invoice.dueDate).toLocaleDateString("es-PE")}
						</Text>
					</View>
					<View style={styles.row}>
						<Text style={styles.label}>Moneda:</Text>
						<Text style={styles.value}>{invoice.currency}</Text>
					</View>
				</View>

				{/* Items Table */}
				<View style={styles.table}>
					<View style={styles.tableHeader}>
						<Text style={styles.col1}>#</Text>
						<Text style={styles.col2}>Descripción</Text>
						<Text style={styles.col3}>Cantidad</Text>
						<Text style={styles.col4}>P. Unit.</Text>
						<Text style={styles.col5}>Total</Text>
					</View>
					{invoice.items.map((item: InvoicePdfItem, index: number) => (
						<View key={index} style={styles.tableRow}>
							<Text style={styles.col1}>{index + 1}</Text>
							<Text style={styles.col2}>{item.description}</Text>
							<Text style={styles.col3}>{item.quantity}</Text>
							<Text style={styles.col4}>
								S/ {parseFloat(item.unitPrice.toString()).toFixed(2)}
							</Text>
							<Text style={styles.col5}>
								S/ {parseFloat(item.total.toString()).toFixed(2)}
							</Text>
						</View>
					))}
				</View>

				{/* Totals */}
				<View style={styles.totals}>
					<View style={styles.totalRow}>
						<Text style={styles.totalLabel}>Subtotal:</Text>
						<Text>S/ {subtotal.toFixed(2)}</Text>
					</View>
					<View style={styles.totalRow}>
						<Text style={styles.totalLabel}>IGV (18%):</Text>
						<Text>S/ {tax.toFixed(2)}</Text>
					</View>
					<View style={styles.totalRow}>
						<Text style={styles.grandTotal}>TOTAL:</Text>
						<Text style={styles.grandTotal}>S/ {total.toFixed(2)}</Text>
					</View>
				</View>

				{/* QR Code */}
				{qrCodeDataUrl && (
					<View style={{ marginTop: 20, alignItems: "center" }}>
						<Image src={qrCodeDataUrl} style={styles.qrCode} />
						<Text style={{ fontSize: 8, marginTop: 5 }}>
							Representación impresa de la Factura Electrónica
						</Text>
					</View>
				)}

				{/* Footer */}
				<View style={styles.footer}>
					<Text>
						Este documento es una representación impresa de la Factura
						Electrónica
					</Text>
					<Text>generada en el Sistema de Emisión Electrónica - SUNAT</Text>
				</View>
			</Page>
		</Document>
	);
};
