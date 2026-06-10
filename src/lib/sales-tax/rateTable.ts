import type { RateTableEntry } from "./types";

export const RATE_TABLE_UPDATED_AT = "2026-06-10";

export const seededRateTable: RateTableEntry[] = [
  {
    jurisdictionId: "CA-941",
    label: "California / San Francisco",
    state: "CA",
    postalCodePrefix: "941",
    rate: 0.08625,
    effectiveFrom: "2025-07-01",
    source: "seed",
    note: "Seeded state and local combined rate for quarterly refresh workflow."
  },
  {
    jurisdictionId: "CA-900",
    label: "California / Los Angeles",
    state: "CA",
    postalCodePrefix: "900",
    rate: 0.095,
    effectiveFrom: "2025-07-01",
    source: "seed",
    note: "Seeded state and local combined rate for quarterly refresh workflow."
  },
  {
    jurisdictionId: "CA-STATE",
    label: "California state fallback",
    state: "CA",
    rate: 0.0725,
    effectiveFrom: "2025-07-01",
    source: "seed",
    note: "Fallback rate when a ZIP prefix is not yet mapped."
  },
  {
    jurisdictionId: "NY-100",
    label: "New York / New York City",
    state: "NY",
    postalCodePrefix: "100",
    rate: 0.0875,
    effectiveFrom: "2025-01-01",
    source: "seed",
    note: "Historical seeded rate kept to detect rate-drift windows."
  },
  {
    jurisdictionId: "NY-100",
    label: "New York / New York City",
    state: "NY",
    postalCodePrefix: "100",
    rate: 0.08875,
    effectiveFrom: "2026-06-01",
    source: "seed",
    note: "Seeded state and local combined rate for quarterly refresh workflow."
  },
  {
    jurisdictionId: "NY-STATE",
    label: "New York state fallback",
    state: "NY",
    rate: 0.04,
    effectiveFrom: "2025-01-01",
    source: "seed",
    note: "Fallback rate when a ZIP prefix is not yet mapped."
  },
  {
    jurisdictionId: "TX-733",
    label: "Texas / Austin",
    state: "TX",
    postalCodePrefix: "733",
    rate: 0.0825,
    effectiveFrom: "2025-01-01",
    source: "seed",
    note: "Seeded state and local combined rate for quarterly refresh workflow."
  },
  {
    jurisdictionId: "TX-STATE",
    label: "Texas state fallback",
    state: "TX",
    rate: 0.0625,
    effectiveFrom: "2025-01-01",
    source: "seed",
    note: "Fallback rate when a ZIP prefix is not yet mapped."
  },
  {
    jurisdictionId: "FL-331",
    label: "Florida / Miami-Dade",
    state: "FL",
    postalCodePrefix: "331",
    rate: 0.07,
    effectiveFrom: "2025-01-01",
    source: "seed",
    note: "Seeded state and local combined rate for quarterly refresh workflow."
  },
  {
    jurisdictionId: "FL-STATE",
    label: "Florida state fallback",
    state: "FL",
    rate: 0.06,
    effectiveFrom: "2025-01-01",
    source: "seed",
    note: "Fallback rate when a ZIP prefix is not yet mapped."
  },
  {
    jurisdictionId: "WA-981",
    label: "Washington / Seattle",
    state: "WA",
    postalCodePrefix: "981",
    rate: 0.1025,
    effectiveFrom: "2025-01-01",
    source: "seed",
    note: "Seeded state and local combined rate for quarterly refresh workflow."
  },
  {
    jurisdictionId: "IL-606",
    label: "Illinois / Chicago",
    state: "IL",
    postalCodePrefix: "606",
    rate: 0.1025,
    effectiveFrom: "2025-01-01",
    source: "seed",
    note: "Seeded state and local combined rate for quarterly refresh workflow."
  },
  {
    jurisdictionId: "PA-191",
    label: "Pennsylvania / Philadelphia",
    state: "PA",
    postalCodePrefix: "191",
    rate: 0.08,
    effectiveFrom: "2025-01-01",
    source: "seed",
    note: "Seeded state and local combined rate for quarterly refresh workflow."
  },
  {
    jurisdictionId: "GA-303",
    label: "Georgia / Atlanta",
    state: "GA",
    postalCodePrefix: "303",
    rate: 0.089,
    effectiveFrom: "2025-01-01",
    source: "seed",
    note: "Seeded state and local combined rate for quarterly refresh workflow."
  }
];

export function findRateEntry(input: {
  state: string;
  postalCode: string;
  orderDate: string;
  rateTable?: readonly RateTableEntry[];
}): RateTableEntry | undefined {
  const state = input.state.toUpperCase();
  const postalCode = input.postalCode.replace(/\D/g, "");
  const orderTime = Date.parse(input.orderDate);
  const rateTable = input.rateTable ?? seededRateTable;

  return rateTable
    .filter((entry) => entry.state === state)
    .filter((entry) => !entry.postalCodePrefix || postalCode.startsWith(entry.postalCodePrefix))
    .filter((entry) => Number.isNaN(orderTime) || Date.parse(entry.effectiveFrom) <= orderTime)
    .sort((a, b) => {
      const prefixDelta = (b.postalCodePrefix?.length ?? 0) - (a.postalCodePrefix?.length ?? 0);
      if (prefixDelta !== 0) {
        return prefixDelta;
      }
      return Date.parse(b.effectiveFrom) - Date.parse(a.effectiveFrom);
    })[0];
}

export function hasNearbyRateChange(input: {
  entry: RateTableEntry;
  orderDate: string;
  rateTable?: readonly RateTableEntry[];
  windowDays?: number;
}): boolean {
  const orderTime = Date.parse(input.orderDate);
  if (Number.isNaN(orderTime)) {
    return false;
  }

  const windowMs = (input.windowDays ?? 7) * 24 * 60 * 60 * 1000;
  const relatedRates = (input.rateTable ?? seededRateTable).filter(
    (entry) => entry.state === input.entry.state && entry.jurisdictionId === input.entry.jurisdictionId
  );

  return relatedRates.some((entry) => Math.abs(Date.parse(entry.effectiveFrom) - orderTime) <= windowMs);
}
