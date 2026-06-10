import type { JurisdictionSummary, ReconciliationFlag, ReconciliationReport } from "./types";

export function toJurisdictionCsv(report: ReconciliationReport): string {
  const rows = [
    [
      "jurisdiction_id",
      "jurisdiction",
      "state",
      "rate",
      "orders",
      "flagged_orders",
      "gross",
      "taxable",
      "collected",
      "expected",
      "variance",
      "variance_percent",
      "label"
    ],
    ...report.jurisdictions.map(jurisdictionToRow)
  ];

  return toCsv(rows);
}

export function toFlaggedOrdersCsv(report: ReconciliationReport): string {
  const rows = [
    [
      "order_reference",
      "order_date",
      "jurisdiction_id",
      "jurisdiction",
      "flag",
      "taxable",
      "collected",
      "expected",
      "variance",
      "label"
    ],
    ...report.flags.map(flagToRow)
  ];

  return toCsv(rows);
}

function jurisdictionToRow(summary: JurisdictionSummary): Array<string | number> {
  return [
    summary.jurisdictionId,
    summary.jurisdictionLabel,
    summary.state,
    summary.rate,
    summary.orderCount,
    summary.flaggedOrderCount,
    summary.grossAmount,
    summary.taxableAmount,
    summary.collectedTax,
    summary.expectedTax,
    summary.variance,
    summary.variancePercent,
    summary.advisoryLabel
  ];
}

function flagToRow(flag: ReconciliationFlag): Array<string | number> {
  return [
    flag.orderNumber,
    flag.createdAt,
    flag.jurisdictionId,
    flag.jurisdictionLabel,
    flag.type,
    flag.taxableAmount,
    flag.collectedTax,
    flag.expectedTax,
    flag.variance,
    flag.advisoryLabel
  ];
}

function toCsv(rows: readonly (readonly (string | number)[])[]): string {
  return `${rows.map((row) => row.map(escapeCell).join(",")).join("\n")}\n`;
}

function escapeCell(value: string | number): string {
  const text = String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}
