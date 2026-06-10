# US Sales-Tax Collected-vs-Filed Reconciler

Read-only Wix App Market app for per-jurisdiction US sales-tax reconciliation.

The app pulls Wix eCommerce orders and order transactions with read-only permissions, computes collected vs expected sales tax by ship-to jurisdiction, and exports advisory CSV/PDF evidence packs for filing review.

## Guardrails

- Read-only Wix scopes only.
- Never writes to Wix.
- Never files or submits returns.
- Stores only seeded rate tables and cached period summaries.
- Every figure is labeled `advisory - confirm before filing`.
- No customer PII is retained in generated reports.

## Scripts

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm build
```

## Local Demo

```bash
pnpm dev
```

The dashboard renders a fixture report unless Wix app credentials and an installed instance are available.
