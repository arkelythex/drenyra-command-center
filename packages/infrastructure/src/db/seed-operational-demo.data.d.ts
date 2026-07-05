export declare const DEFAULT_VISIBLE_MONTHS = 6;
export declare const IGV_RATE = 0.18;
export declare const DEMO_PARTNERS: readonly [
	{
		readonly key: "customer_anchor";
		readonly taxId: "20614567891";
		readonly legalName: "DISTRIBUCIONES NEBULA RETAIL S.A.C.";
		readonly email: "tesoreria@nebularetail.demo.pe";
	},
	{
		readonly key: "customer_industrial";
		readonly taxId: "20614567892";
		readonly legalName: "CONSTRUCTORA COSTA VERDE INGENIERIA S.A.C.";
		readonly email: "pagos@costaverde.demo.pe";
	},
	{
		readonly key: "customer_food";
		readonly taxId: "20614567893";
		readonly legalName: "ALIMENTOS PACIFICO SUR S.A.C.";
		readonly email: "facturacion@pacificosur.demo.pe";
	},
	{
		readonly key: "vendor_fleet";
		readonly taxId: "20614567901";
		readonly legalName: "SERVICIOS DE FLOTA ANDINA S.A.C.";
		readonly email: "cobranza@flotaandina.demo.pe";
	},
	{
		readonly key: "vendor_energy";
		readonly taxId: "20614567902";
		readonly legalName: "ENERGIA Y SOPORTE LIMA CENTRO S.A.C.";
		readonly email: "facturas@energialc.demo.pe";
	},
	{
		readonly key: "vendor_software";
		readonly taxId: "20614567903";
		readonly legalName: "TECNOLOGIA OPERATIVA DEL PACIFICO S.A.C.";
		readonly email: "cuentas@topacifico.demo.pe";
	},
];
export declare const DEMO_PRODUCTS: readonly [
	{
		readonly key: "route";
		readonly sku: "LOG-001";
		readonly name: "Servicio de distribucion urbana";
		readonly unitPrice: 4200;
		readonly costPrice: 2550;
		readonly unit: "UND";
	},
	{
		readonly key: "fleet";
		readonly sku: "LOG-002";
		readonly name: "Mantenimiento preventivo de flota";
		readonly unitPrice: 1800;
		readonly costPrice: 980;
		readonly unit: "UND";
	},
	{
		readonly key: "tms";
		readonly sku: "LOG-003";
		readonly name: "Licencia TMS mensual";
		readonly unitPrice: 950;
		readonly costPrice: 310;
		readonly unit: "MES";
	},
	{
		readonly key: "scanner";
		readonly sku: "LOG-004";
		readonly name: "Scanner handheld Zebra TC22";
		readonly unitPrice: 1650;
		readonly costPrice: 1190;
		readonly unit: "UND";
	},
];
export declare const INVOICE_BLUEPRINTS: readonly [
	{
		readonly correlative: 201;
		readonly monthOffset: -5;
		readonly day: 7;
		readonly subtotal: 12200;
		readonly status: "PAID";
		readonly sunatStatus: "ACCEPTED";
		readonly customerKey: "customer_anchor";
		readonly productKey: "route";
	},
	{
		readonly correlative: 202;
		readonly monthOffset: -4;
		readonly day: 9;
		readonly subtotal: 14800;
		readonly status: "PAID";
		readonly sunatStatus: "ACCEPTED";
		readonly customerKey: "customer_food";
		readonly productKey: "route";
	},
	{
		readonly correlative: 203;
		readonly monthOffset: -3;
		readonly day: 11;
		readonly subtotal: 9800;
		readonly status: "PAID";
		readonly sunatStatus: "ACCEPTED";
		readonly customerKey: "customer_industrial";
		readonly productKey: "tms";
	},
	{
		readonly correlative: 204;
		readonly monthOffset: -2;
		readonly day: 8;
		readonly subtotal: 13200;
		readonly status: "PAID";
		readonly sunatStatus: "ACCEPTED";
		readonly customerKey: "customer_anchor";
		readonly productKey: "fleet";
	},
	{
		readonly correlative: 205;
		readonly monthOffset: -1;
		readonly day: 14;
		readonly subtotal: 16400;
		readonly status: "SENT";
		readonly sunatStatus: "ACCEPTED";
		readonly customerKey: "customer_industrial";
		readonly productKey: "route";
	},
	{
		readonly correlative: 206;
		readonly monthOffset: 0;
		readonly day: 3;
		readonly subtotal: 18400;
		readonly status: "PAID";
		readonly sunatStatus: "ACCEPTED";
		readonly customerKey: "customer_anchor";
		readonly productKey: "route";
	},
	{
		readonly correlative: 207;
		readonly monthOffset: 0;
		readonly day: 9;
		readonly subtotal: 9100;
		readonly status: "SENT";
		readonly sunatStatus: "SUBMITTED";
		readonly customerKey: "customer_food";
		readonly productKey: "tms";
	},
	{
		readonly correlative: 208;
		readonly monthOffset: 0;
		readonly day: 15;
		readonly subtotal: 7600;
		readonly status: "OVERDUE";
		readonly sunatStatus: "REJECTED";
		readonly customerKey: "customer_industrial";
		readonly productKey: "fleet";
	},
	{
		readonly correlative: 209;
		readonly monthOffset: 0;
		readonly day: 21;
		readonly subtotal: 5400;
		readonly status: "DRAFT";
		readonly sunatStatus: null;
		readonly customerKey: "customer_anchor";
		readonly productKey: "scanner";
	},
];
export declare const BILL_BLUEPRINTS: readonly [
	{
		readonly billNumber: "B001-00003011";
		readonly monthOffset: -1;
		readonly day: 6;
		readonly subtotal: 6200;
		readonly status: "PAID";
		readonly vendorKey: "vendor_fleet";
		readonly productKey: "fleet";
	},
	{
		readonly billNumber: "B001-00003012";
		readonly monthOffset: 0;
		readonly day: 4;
		readonly subtotal: 4100;
		readonly status: "PAID";
		readonly vendorKey: "vendor_energy";
		readonly productKey: "scanner";
	},
	{
		readonly billNumber: "B001-00003013";
		readonly monthOffset: 0;
		readonly day: 12;
		readonly subtotal: 2800;
		readonly status: "SENT";
		readonly vendorKey: "vendor_software";
		readonly productKey: "tms";
	},
	{
		readonly billNumber: "B001-00003014";
		readonly monthOffset: 0;
		readonly day: 18;
		readonly subtotal: 1900;
		readonly status: "DRAFT";
		readonly vendorKey: "vendor_energy";
		readonly productKey: "fleet";
	},
];
export declare const BANK_TRANSACTION_BLUEPRINTS: readonly [
	{
		readonly monthOffset: -5;
		readonly day: 8;
		readonly type: "CREDIT";
		readonly amount: 14396;
		readonly description: "Cobro factura F001-00000201";
		readonly invoiceIndex: 0;
	},
	{
		readonly monthOffset: -4;
		readonly day: 11;
		readonly type: "CREDIT";
		readonly amount: 17464;
		readonly description: "Cobro factura F001-00000202";
		readonly invoiceIndex: 1;
	},
	{
		readonly monthOffset: -3;
		readonly day: 12;
		readonly type: "DEBIT";
		readonly amount: 7316;
		readonly description: "Pago proveedor mantenimiento";
		readonly billIndex: 0;
	},
	{
		readonly monthOffset: -2;
		readonly day: 9;
		readonly type: "CREDIT";
		readonly amount: 15576;
		readonly description: "Cobro factura F001-00000204";
		readonly invoiceIndex: 3;
	},
	{
		readonly monthOffset: -1;
		readonly day: 15;
		readonly type: "DEBIT";
		readonly amount: 4838;
		readonly description: "Pago energia operativa";
		readonly billIndex: 1;
	},
	{
		readonly monthOffset: 0;
		readonly day: 5;
		readonly type: "CREDIT";
		readonly amount: 21712;
		readonly description: "Cobro factura F001-00000206";
		readonly invoiceIndex: 5;
	},
	{
		readonly monthOffset: 0;
		readonly day: 10;
		readonly type: "DEBIT";
		readonly amount: 3304;
		readonly description: "Pago licencia TMS";
		readonly billIndex: 2;
	},
	{
		readonly monthOffset: 0;
		readonly day: 20;
		readonly type: "DEBIT";
		readonly amount: 2750;
		readonly description: "Pago combustible y peajes";
		readonly billIndex: null;
	},
];
//# sourceMappingURL=seed-operational-demo.data.d.ts.map
