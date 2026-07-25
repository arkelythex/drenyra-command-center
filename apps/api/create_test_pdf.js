import fs from "node:fs";
import PDFDocument from "pdfkit";

// Crear un PDF simple de prueba
const doc = new PDFDocument();
doc.pipe(fs.createWriteStream("./test_invoice.pdf"));

// Contenido de la factura
doc.fontSize(16).text("FACTURA ELECTRÓNICA", { align: "center" });
doc.moveDown();

doc.fontSize(12);
doc.text("Serie: F001");
doc.text("Número: 00000123");
doc.text("Fecha de Emisión: 19/01/2025");
doc.moveDown();

doc.fontSize(14).text("ARKALYTHIX SOFTWARE S.A.C.", { underline: true });
doc.fontSize(10);
doc.text("RUC: 20123456789");
doc.text("Dirección: AV. LARCO 123, MIRAFLORES, LIMA");
doc.moveDown();

doc.fontSize(14).text("CLIENTE:", { underline: true });
doc.fontSize(10);
doc.text("RUC: 10456789012");
doc.text("Razón Social: CLIENTE DEMO S.A.C.");
doc.moveDown();

doc.fontSize(14).text("DETALLE DE FACTURA:", { underline: true });
doc.moveDown();

doc.fontSize(10);
doc.text("Descripción: SERVICIO DE DESARROLLO DE SOFTWARE EMPRESARIAL");
doc.text("Cantidad: 10.00");
doc.text("Precio Unitario: S/ 150.00");
doc.text("Subtotal: S/ 1,500.00");
doc.moveDown();

doc.text("Subtotal: S/ 1,500.00");
doc.text("IGV (18%): S/ 270.00");
doc.fontSize(12).text("TOTAL A PAGAR: S/ 1,770.00", { bold: true });
doc.moveDown();

doc.fontSize(8);
doc.text("Monto en letras: MIL SETECIENTOS SETENTA Y 00/100 SOLES");
doc.moveDown();
doc.text("Factura generada por sistema Arkalythix v2.0");
doc.text("RUC del emisor: 20123456789");

doc.end();

console.log("PDF de prueba creado: test_invoice.pdf");
