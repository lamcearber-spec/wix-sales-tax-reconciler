export const ADVISORY_LABEL = "advisory — confirm before filing";

export type MoneyInput =
  | number
  | string
  | {
      amount?: number | string;
      value?: number | string;
      formattedAmount?: string;
    }
  | null
  | undefined;

export type RateTableEntry = {
  jurisdictionId: string;
  label: string;
  state: string;
  postalCodePrefix?: string;
  rate: number;
  effectiveFrom: string;
  source: "seed";
  note: string;
};

export type NormalizedOrder = {
  orderId: string;
  orderNumber: string;
  createdAt: string;
  state: string;
  postalCode: string;
  country: string;
  grossAmount: number;
  taxableAmount: number;
  collectedTax: number;
  refundedAmount: number;
  paymentNetAmount: number;
  observedTaxRate?: number;
};

export type ReconciliationFlagType = "under_collected" | "over_collected" | "untaxed_but_taxable" | "rate_drift";

export type ReconciliationFlag = {
  orderId: string;
  orderNumber: string;
  createdAt: string;
  jurisdictionId: string;
  jurisdictionLabel: string;
  type: ReconciliationFlagType;
  taxableAmount: number;
  collectedTax: number;
  expectedTax: number;
  variance: number;
  advisoryLabel: string;
};

export type JurisdictionSummary = {
  jurisdictionId: string;
  jurisdictionLabel: string;
  state: string;
  rate: number;
  orderCount: number;
  flaggedOrderCount: number;
  grossAmount: number;
  taxableAmount: number;
  collectedTax: number;
  expectedTax: number;
  variance: number;
  variancePercent: number;
  advisoryLabel: string;
};

export type ReconciliationReport = {
  accountName: string;
  generatedAt: string;
  periodStart: string;
  periodEnd: string;
  currency: string;
  advisoryLabel: string;
  totals: {
    orderCount: number;
    flaggedOrderCount: number;
    grossAmount: number;
    taxableAmount: number;
    collectedTax: number;
    expectedTax: number;
    variance: number;
  };
  jurisdictions: JurisdictionSummary[];
  flags: ReconciliationFlag[];
  rateTableUpdatedAt: string;
};

export type WixOrderLineLike = {
  id?: string;
  name?: string;
  quantity?: number;
  totalPriceBeforeTax?: MoneyInput;
  price?: MoneyInput;
  priceData?: {
    price?: MoneyInput;
    totalPrice?: MoneyInput;
    taxIncludedInPrice?: boolean;
  };
  tax?: MoneyInput;
  taxDetails?: {
    taxableAmount?: MoneyInput;
    taxRate?: number | string;
    totalTax?: MoneyInput;
  };
};

export type WixOrderLike = {
  id?: string;
  number?: string | number;
  createdDate?: string;
  dateCreated?: string;
  currency?: string;
  lineItems?: WixOrderLineLike[];
  priceSummary?: Record<string, unknown>;
  totalPriceBeforeTax?: MoneyInput;
  totalPriceAfterTax?: MoneyInput;
  taxSummary?: Record<string, unknown>;
  tax?: MoneyInput;
  shippingInfo?: Record<string, unknown>;
  recipientInfo?: Record<string, unknown>;
  billingInfo?: Record<string, unknown>;
  buyerInfo?: Record<string, unknown>;
};

export type WixOrderTransactionsLike = {
  orderTransactions?: {
    payments?: Array<Record<string, unknown>>;
    refunds?: Array<Record<string, unknown>>;
  };
  payments?: Array<Record<string, unknown>>;
  refunds?: Array<Record<string, unknown>>;
};
