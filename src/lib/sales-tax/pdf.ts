import { PassThrough } from "node:stream";
import PDFDocument from "pdfkit/js/pdfkit.standalone.js";
import type { ReconciliationReport } from "./types";

export async function renderReconciliationPdf(report: ReconciliationReport): Promise<Uint8Array> {
  const doc = new PDFDocument({ size: "A4", margin: 42 });
  const chunks: Buffer[] = [];
  const stream = new PassThrough();
  const finished = new Promise<void>((resolve, reject) => {
    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    stream.on("end", resolve);
    stream.on("error", reject);
  });

  doc.pipe(stream);
  renderCover(doc, report);
  renderJurisdictions(doc, report);
  renderFlags(doc, report);
  doc.end();

  await finished;
  return Buffer.concat(chunks);
}

function renderCover(doc: PDFKit.PDFDocument, report: ReconciliationReport): void {
  doc.fontSize(10).fillColor("#0f766e").text("US SALES-TAX RECONCILIATION");
  doc.moveDown(0.3);
  doc.fontSize(23).fillColor("#111827").text("Collected vs Expected by Jurisdiction");
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor("#667085").text(`Store: ${report.accountName}`);
  doc.text(`Period: ${report.periodStart} to ${report.periodEnd}`);
  doc.text(`Generated: ${report.generatedAt}`);
  doc.text(`Rate table seed: ${report.rateTableUpdatedAt}`);
  doc.moveDown(0.8);
  doc.fontSize(11).fillColor("#9a3412").text(report.advisoryLabel, { width: 500 });
  doc.moveDown(1);

  fact(doc, "Orders", String(report.totals.orderCount));
  fact(doc, "Flagged orders", String(report.totals.flaggedOrderCount));
  fact(doc, "Taxable", money(report.totals.taxableAmount, report.currency));
  fact(doc, "Collected", money(report.totals.collectedTax, report.currency));
  fact(doc, "Expected", money(report.totals.expectedTax, report.currency));
  fact(doc, "Variance", money(report.totals.variance, report.currency));
}

function renderJurisdictions(doc: PDFKit.PDFDocument, report: ReconciliationReport): void {
  doc.addPage();
  doc.fontSize(16).fillColor("#111827").text("Jurisdiction Summary");
  doc.moveDown(0.5);

  for (const jurisdiction of report.jurisdictions) {
    ensureSpace(doc, 58);
    doc.fontSize(9).fillColor("#667085").text(`${jurisdiction.jurisdictionId} | rate ${(jurisdiction.rate * 100).toFixed(3)}%`);
    doc.fontSize(11).fillColor("#111827").text(jurisdiction.jurisdictionLabel);
    doc.fontSize(9).fillColor("#353842").text(
      `Gross ${money(jurisdiction.grossAmount, report.currency)} | Taxable ${money(jurisdiction.taxableAmount, report.currency)} | Collected ${money(jurisdiction.collectedTax, report.currency)} | Expected ${money(jurisdiction.expectedTax, report.currency)} | Variance ${money(jurisdiction.variance, report.currency)}`
    );
    doc.fontSize(8).fillColor("#9a3412").text(jurisdiction.advisoryLabel);
    doc.moveDown(0.45);
  }
}

function renderFlags(doc: PDFKit.PDFDocument, report: ReconciliationReport): void {
  doc.addPage();
  doc.fontSize(16).fillColor("#111827").text("Flagged Orders");
  doc.moveDown(0.5);

  if (report.flags.length === 0) {
    doc.fontSize(10).fillColor("#475467").text("No flagged orders in this period.");
    return;
  }

  for (const flag of report.flags) {
    ensureSpace(doc, 52);
    doc.fontSize(9).fillColor("#667085").text(`${flag.orderNumber} | ${flag.createdAt} | ${flag.jurisdictionId}`);
    doc.fontSize(10).fillColor("#111827").text(`${flag.type}: variance ${money(flag.variance, report.currency)}`);
    doc.fontSize(8).fillColor("#9a3412").text(flag.advisoryLabel);
    doc.moveDown(0.35);
  }
}

function fact(doc: PDFKit.PDFDocument, label: string, value: string): void {
  doc.fontSize(8).fillColor("#667085").text(label.toUpperCase());
  doc.fontSize(15).fillColor("#111827").text(value);
  doc.moveDown(0.42);
}

function ensureSpace(doc: PDFKit.PDFDocument, height: number): void {
  if (doc.y + height > doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
  }
}

function money(value: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(value);
}
