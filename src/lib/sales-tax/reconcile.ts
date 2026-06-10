import { RATE_TABLE_UPDATED_AT, findRateEntry, hasNearbyRateChange, seededRateTable } from "./rateTable";
import {
  ADVISORY_LABEL,
  type JurisdictionSummary,
  type NormalizedOrder,
  type RateTableEntry,
  type ReconciliationFlag,
  type ReconciliationFlagType,
  type ReconciliationReport,
  type WixOrderLike,
  type WixOrderLineLike,
  type WixOrderTransactionsLike
} from "./types";

const CENT_THRESHOLD = 0.5;

export function reconcileOrders(input: {
  orders: readonly WixOrderLike[];
  transactionsByOrderId?: Readonly<Record<string, WixOrderTransactionsLike>>;
  accountName?: string;
  periodStart: string;
  periodEnd: string;
  currency?: string;
  generatedAt?: string;
  rateTable?: readonly RateTableEntry[];
}): ReconciliationReport {
  const rateTable = input.rateTable ?? seededRateTable;
  const currency = input.currency ?? inferCurrency(input.orders) ?? "USD";
  const normalizedOrders = input.orders.map((order) =>
    normalizeWixOrder(order, input.transactionsByOrderId?.[String(order.id ?? "")])
  );

  const jurisdictionMap = new Map<string, JurisdictionSummary>();
  const flags: ReconciliationFlag[] = [];

  for (const order of normalizedOrders) {
    const rateEntry =
      findRateEntry({ state: order.state, postalCode: order.postalCode, orderDate: order.createdAt, rateTable }) ??
      buildUnmappedRate(order);
    const expectedTax = roundCurrency(order.taxableAmount * rateEntry.rate);
    const variance = roundCurrency(order.collectedTax - expectedTax);
    const jurisdiction = ensureJurisdiction(jurisdictionMap, rateEntry);
    const orderFlags = classifyFlags({ order, rateEntry, expectedTax, variance, rateTable });

    jurisdiction.orderCount += 1;
    jurisdiction.grossAmount = roundCurrency(jurisdiction.grossAmount + order.grossAmount);
    jurisdiction.taxableAmount = roundCurrency(jurisdiction.taxableAmount + order.taxableAmount);
    jurisdiction.collectedTax = roundCurrency(jurisdiction.collectedTax + order.collectedTax);
    jurisdiction.expectedTax = roundCurrency(jurisdiction.expectedTax + expectedTax);
    jurisdiction.variance = roundCurrency(jurisdiction.variance + variance);
    jurisdiction.flaggedOrderCount += orderFlags.length > 0 ? 1 : 0;

    for (const type of orderFlags) {
      flags.push({
        orderId: order.orderId,
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        jurisdictionId: rateEntry.jurisdictionId,
        jurisdictionLabel: rateEntry.label,
        type,
        taxableAmount: order.taxableAmount,
        collectedTax: order.collectedTax,
        expectedTax,
        variance,
        advisoryLabel: ADVISORY_LABEL
      });
    }
  }

  const jurisdictions = Array.from(jurisdictionMap.values())
    .map((summary) => ({
      ...summary,
      variancePercent: summary.expectedTax === 0 ? 0 : roundPercent((summary.variance / summary.expectedTax) * 100)
    }))
    .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));

  const totals = jurisdictions.reduce(
    (accumulator, summary) => ({
      orderCount: accumulator.orderCount + summary.orderCount,
      flaggedOrderCount: accumulator.flaggedOrderCount + summary.flaggedOrderCount,
      grossAmount: roundCurrency(accumulator.grossAmount + summary.grossAmount),
      taxableAmount: roundCurrency(accumulator.taxableAmount + summary.taxableAmount),
      collectedTax: roundCurrency(accumulator.collectedTax + summary.collectedTax),
      expectedTax: roundCurrency(accumulator.expectedTax + summary.expectedTax),
      variance: roundCurrency(accumulator.variance + summary.variance)
    }),
    {
      orderCount: 0,
      flaggedOrderCount: 0,
      grossAmount: 0,
      taxableAmount: 0,
      collectedTax: 0,
      expectedTax: 0,
      variance: 0
    }
  );

  return {
    accountName: input.accountName ?? "Wix demo store",
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    currency,
    advisoryLabel: ADVISORY_LABEL,
    totals,
    jurisdictions,
    flags: flags.sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance)),
    rateTableUpdatedAt: RATE_TABLE_UPDATED_AT
  };
}

export function normalizeWixOrder(order: WixOrderLike, transactions?: WixOrderTransactionsLike): NormalizedOrder {
  const lineItems = order.lineItems ?? [];
  const taxableAmount = roundCurrency(sum(lineItems.map(getLineTaxableAmount)));
  const lineTax = roundCurrency(sum(lineItems.map(getLineCollectedTax)));
  const orderTax = firstMoney(order.tax, nested(order.taxSummary, ["totalTax"]), nested(order.priceSummary, ["tax"]));
  const collectedTax = roundCurrency(lineTax || orderTax);
  const grossAmount = roundCurrency(
    firstMoney(
      order.totalPriceAfterTax,
      nested(order.priceSummary, ["total"]),
      nested(order.priceSummary, ["totalPrice"]),
      taxableAmount + collectedTax
    )
  );
  const address = extractShipToAddress(order);
  const transactionSummary = summarizeTransactions(transactions);

  return {
    orderId: String(order.id ?? order.number ?? "unknown-order"),
    orderNumber: String(order.number ?? order.id ?? "unknown"),
    createdAt: order.createdDate ?? order.dateCreated ?? new Date(0).toISOString(),
    state: normalizeState(address.state),
    postalCode: String(address.postalCode ?? ""),
    country: String(address.country ?? "US").toUpperCase(),
    grossAmount,
    taxableAmount,
    collectedTax,
    refundedAmount: transactionSummary.refundedAmount,
    paymentNetAmount: roundCurrency(transactionSummary.paymentAmount - transactionSummary.refundedAmount),
    observedTaxRate: getObservedTaxRate(lineItems, taxableAmount, collectedTax)
  };
}

export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function roundPercent(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function classifyFlags(input: {
  order: NormalizedOrder;
  rateEntry: RateTableEntry;
  expectedTax: number;
  variance: number;
  rateTable: readonly RateTableEntry[];
}): ReconciliationFlagType[] {
  const flags: ReconciliationFlagType[] = [];

  if (input.order.taxableAmount > CENT_THRESHOLD && input.order.collectedTax <= CENT_THRESHOLD) {
    flags.push("untaxed_but_taxable");
  } else if (input.variance < -CENT_THRESHOLD) {
    flags.push("under_collected");
  } else if (input.variance > CENT_THRESHOLD) {
    flags.push("over_collected");
  }

  const rateDelta = Math.abs((input.order.observedTaxRate ?? input.rateEntry.rate) - input.rateEntry.rate);
  if (
    input.order.observedTaxRate !== undefined &&
    rateDelta >= 0.0025 &&
    hasNearbyRateChange({
      entry: input.rateEntry,
      orderDate: input.order.createdAt,
      rateTable: input.rateTable
    })
  ) {
    flags.push("rate_drift");
  }

  return flags;
}

function ensureJurisdiction(map: Map<string, JurisdictionSummary>, rateEntry: RateTableEntry): JurisdictionSummary {
  const existing = map.get(rateEntry.jurisdictionId);
  if (existing) {
    return existing;
  }

  const summary: JurisdictionSummary = {
    jurisdictionId: rateEntry.jurisdictionId,
    jurisdictionLabel: rateEntry.label,
    state: rateEntry.state,
    rate: rateEntry.rate,
    orderCount: 0,
    flaggedOrderCount: 0,
    grossAmount: 0,
    taxableAmount: 0,
    collectedTax: 0,
    expectedTax: 0,
    variance: 0,
    variancePercent: 0,
    advisoryLabel: ADVISORY_LABEL
  };
  map.set(rateEntry.jurisdictionId, summary);
  return summary;
}

function buildUnmappedRate(order: NormalizedOrder): RateTableEntry {
  const state = order.state || "UN";
  const postal = order.postalCode.slice(0, 3) || "unknown";
  return {
    jurisdictionId: `${state}-${postal}`,
    label: `${state} / unmapped ${postal}`,
    state,
    postalCodePrefix: postal === "unknown" ? undefined : postal,
    rate: 0,
    effectiveFrom: "1970-01-01",
    source: "seed",
    note: "Unmapped jurisdiction; refresh the rate table before filing."
  };
}

function getLineTaxableAmount(line: WixOrderLineLike): number {
  const quantity = typeof line.quantity === "number" && line.quantity > 0 ? line.quantity : 1;
  return firstMoney(
    line.taxDetails?.taxableAmount,
    line.totalPriceBeforeTax,
    line.priceData?.totalPrice,
    firstMoney(line.price, line.priceData?.price) * quantity
  );
}

function getLineCollectedTax(line: WixOrderLineLike): number {
  return firstMoney(line.taxDetails?.totalTax, line.tax);
}

function getObservedTaxRate(
  lineItems: readonly WixOrderLineLike[],
  taxableAmount: number,
  collectedTax: number
): number | undefined {
  const explicitRates = lineItems
    .map((line) => parseRate(line.taxDetails?.taxRate))
    .filter((rate): rate is number => rate !== undefined);

  if (explicitRates.length > 0) {
    return explicitRates.reduce((accumulator, rate) => accumulator + rate, 0) / explicitRates.length;
  }

  if (taxableAmount > 0 && collectedTax > 0) {
    return collectedTax / taxableAmount;
  }

  return undefined;
}

function parseRate(rate: number | string | undefined): number | undefined {
  if (rate === undefined || rate === "") {
    return undefined;
  }
  const parsed = Number(rate);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }
  return parsed > 1 ? parsed / 100 : parsed;
}

function summarizeTransactions(transactions?: WixOrderTransactionsLike): {
  paymentAmount: number;
  refundedAmount: number;
} {
  const payments = transactions?.orderTransactions?.payments ?? transactions?.payments ?? [];
  const refunds = transactions?.orderTransactions?.refunds ?? transactions?.refunds ?? [];
  const paymentAmount = roundCurrency(sum(payments.map((payment) => firstMoney(nested(payment, ["amount"]), payment.amount))));
  const refundedAmount = roundCurrency(
    sum(
      refunds.flatMap((refund) => {
        const transactionsList = nested(refund, ["transactions"]);
        if (Array.isArray(transactionsList)) {
          return transactionsList.map((transaction) => firstMoney(nested(transaction, ["amount"]), transaction.amount));
        }
        return firstMoney(nested(refund, ["amount"]), refund.amount);
      })
    )
  );

  return { paymentAmount, refundedAmount };
}

function extractShipToAddress(order: WixOrderLike): { state?: unknown; postalCode?: unknown; country?: unknown } {
  const candidates = [
    nested(order.shippingInfo, ["logistics", "shippingDestination", "address"]),
    nested(order.shippingInfo, ["shippingDestination", "address"]),
    nested(order.shippingInfo, ["address"]),
    nested(order.recipientInfo, ["address"]),
    nested(order.billingInfo, ["address"])
  ];

  for (const candidate of candidates) {
    if (isRecord(candidate)) {
      return {
        state:
          candidate.subdivision ??
          candidate.subdivisionCode ??
          candidate.state ??
          candidate.region ??
          candidate.administrativeArea,
        postalCode: candidate.postalCode ?? candidate.zipCode ?? candidate.zip,
        country: candidate.country ?? candidate.countryCode
      };
    }
  }

  return {};
}

function normalizeState(value: unknown): string {
  return String(value ?? "")
    .toUpperCase()
    .replace(/^US-/, "")
    .slice(0, 2);
}

function inferCurrency(orders: readonly WixOrderLike[]): string | undefined {
  return orders.map((order) => order.currency).find(Boolean);
}

function firstMoney(...values: unknown[]): number {
  for (const value of values) {
    const parsed = parseMoney(value);
    if (parsed !== undefined) {
      return parsed;
    }
  }
  return 0;
}

function parseMoney(value: unknown): number | undefined {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  if (isRecord(value)) {
    return firstDefinedNumber(value.amount, value.value, value.formattedAmount);
  }
  return undefined;
}

function firstDefinedNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    const parsed = parseMoney(value);
    if (parsed !== undefined) {
      return parsed;
    }
  }
  return undefined;
}

function nested(source: unknown, path: string[]): unknown {
  return path.reduce<unknown>((current, key) => (isRecord(current) ? current[key] : undefined), source);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function sum(values: readonly number[]): number {
  return values.reduce((accumulator, value) => accumulator + value, 0);
}
