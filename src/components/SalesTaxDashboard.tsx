import {
  AlertTriangle,
  BadgeDollarSign,
  CalendarDays,
  Download,
  FileText,
  ShieldCheck,
  Table2
} from "lucide-react";
import type { ReconciliationFlagType, ReconciliationReport } from "@/lib/sales-tax/types";

type SalesTaxDashboardProps = {
  report: ReconciliationReport;
  installUrl?: string;
  mode: "fixture" | "live";
};

const flagLabels: Record<ReconciliationFlagType, string> = {
  under_collected: "Under-collected",
  over_collected: "Over-collected",
  untaxed_but_taxable: "Untaxed taxable",
  rate_drift: "Rate drift"
};

export function SalesTaxDashboard({ report, installUrl, mode }: SalesTaxDashboardProps) {
  const query = new URLSearchParams({
    from: report.periodStart,
    to: report.periodEnd
  }).toString();

  return (
    <main className="shell">
      <section className="topbar">
        <div>
          <p className="eyebrow">Wix App Market / Accounting</p>
          <h1>US Sales-Tax Reconciler</h1>
          <p className="subcopy">{report.accountName}</p>
        </div>
        <div className="top-actions">
          <span className="mode-pill">
            <ShieldCheck size={16} aria-hidden />
            {mode === "live" ? "Live read-only" : "Demo fixture"}
          </span>
          {installUrl ? (
            <a className="button-link button-dark" href={installUrl}>
              Connect Wix
            </a>
          ) : null}
        </div>
      </section>

      <form className="period-bar" action="/" method="get">
        <label>
          <CalendarDays size={16} aria-hidden />
          <span>From</span>
          <input type="date" name="from" defaultValue={report.periodStart} />
        </label>
        <label>
          <CalendarDays size={16} aria-hidden />
          <span>To</span>
          <input type="date" name="to" defaultValue={report.periodEnd} />
        </label>
        <button type="submit" className="button-link">
          Refresh
        </button>
      </form>

      <section className="metrics" aria-label="Advisory totals">
        <Metric label="Gross" value={money(report.totals.grossAmount, report.currency)} tone="neutral" />
        <Metric label="Taxable" value={money(report.totals.taxableAmount, report.currency)} tone="blue" />
        <Metric label="Collected" value={money(report.totals.collectedTax, report.currency)} tone="green" />
        <Metric label="Expected" value={money(report.totals.expectedTax, report.currency)} tone="amber" />
        <Metric label="Variance" value={money(report.totals.variance, report.currency)} tone={report.totals.variance < 0 ? "red" : "green"} />
        <Metric label="Flagged" value={String(report.totals.flaggedOrderCount)} tone={report.totals.flaggedOrderCount > 0 ? "red" : "green"} />
      </section>

      <div className="notice">
        <AlertTriangle size={17} aria-hidden />
        <span>{report.advisoryLabel}</span>
      </div>

      <section className="action-row" aria-label="Downloads">
        <a className="button-link" href={`/api/reconciliation/jurisdictions.csv?${query}`}>
          <Download size={16} aria-hidden />
          Jurisdictions CSV
        </a>
        <a className="button-link" href={`/api/reconciliation/flags.csv?${query}`}>
          <Download size={16} aria-hidden />
          Flagged CSV
        </a>
        <a className="button-link button-dark" href={`/api/reconciliation/report.pdf?${query}`}>
          <FileText size={16} aria-hidden />
          Return PDF
        </a>
      </section>

      <section className="grid-two">
        <article className="panel">
          <div className="panel-head">
            <h2>
              <Table2 size={18} aria-hidden />
              Jurisdictions
            </h2>
            <span className="badge">{report.jurisdictions.length}</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Jurisdiction</th>
                  <th>Rate</th>
                  <th>Taxable</th>
                  <th>Collected</th>
                  <th>Expected</th>
                  <th>Variance</th>
                </tr>
              </thead>
              <tbody>
                {report.jurisdictions.map((jurisdiction) => (
                  <tr key={jurisdiction.jurisdictionId}>
                    <td>
                      <strong>{jurisdiction.jurisdictionLabel}</strong>
                      <span>{jurisdiction.advisoryLabel}</span>
                    </td>
                    <td>{percent(jurisdiction.rate)}</td>
                    <td>{money(jurisdiction.taxableAmount, report.currency)}</td>
                    <td>{money(jurisdiction.collectedTax, report.currency)}</td>
                    <td>{money(jurisdiction.expectedTax, report.currency)}</td>
                    <td className={jurisdiction.variance < 0 ? "negative" : "positive"}>
                      {money(jurisdiction.variance, report.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel">
          <div className="panel-head">
            <h2>
              <BadgeDollarSign size={18} aria-hidden />
              Flagged Orders
            </h2>
            <span className="badge badge-risk">{report.flags.length}</span>
          </div>
          <div className="flag-list">
            {report.flags.length === 0 ? (
              <p className="empty-state">No flags in this period.</p>
            ) : (
              report.flags.slice(0, 8).map((flag) => (
                <div className="flag-row" key={`${flag.orderId}-${flag.type}`}>
                  <div>
                    <strong>{flagLabels[flag.type]}</strong>
                    <span>
                      #{flag.orderNumber} · {flag.jurisdictionLabel}
                    </span>
                    <em>{flag.advisoryLabel}</em>
                  </div>
                  <b className={flag.variance < 0 ? "negative" : "positive"}>{money(flag.variance, report.currency)}</b>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </main>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <article className={`metric metric-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <em>advisory — confirm before filing</em>
    </article>
  );
}

function money(value: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(value);
}

function percent(value: number): string {
  return `${(value * 100).toFixed(3)}%`;
}
