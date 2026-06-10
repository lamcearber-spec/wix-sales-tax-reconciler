import { reconcileOrders } from "@/lib/sales-tax/reconcile";
import type { ReconciliationReport, WixOrderLike, WixOrderTransactionsLike } from "@/lib/sales-tax/types";
import { buildClientCredentialsTokenRequest, type WixTokenResponse } from "./oauth";

export const WIX_ORDERS_SEARCH_URL = "https://www.wixapis.com/ecom/v1/orders/search";
export const WIX_ORDER_TRANSACTIONS_URL = "https://www.wixapis.com/ecom/v1/payments/orders";

export async function fetchWixAccessToken(input: {
  appId: string;
  appSecret: string;
  instanceId: string;
  fetcher?: typeof fetch;
}): Promise<string> {
  const request = buildClientCredentialsTokenRequest(input);
  const response = await (input.fetcher ?? fetch)(request.url, request.init);
  const token = (await response.json()) as WixTokenResponse;

  if (!response.ok || !token.access_token) {
    throw new Error("Unable to obtain Wix access token");
  }

  return token.access_token;
}

export async function fetchWixSalesTaxReport(input: {
  accessToken: string;
  periodStart: string;
  periodEnd: string;
  accountName?: string;
  fetcher?: typeof fetch;
}): Promise<ReconciliationReport> {
  const fetcher = input.fetcher ?? fetch;
  const orders = await listOrders({
    accessToken: input.accessToken,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    fetcher
  });
  const transactionsByOrderId: Record<string, WixOrderTransactionsLike> = {};

  await Promise.all(
    orders.map(async (order) => {
      const orderId = String(order.id ?? "");
      if (orderId) {
        transactionsByOrderId[orderId] = await getOrderTransactions({
          accessToken: input.accessToken,
          orderId,
          fetcher
        });
      }
    })
  );

  return reconcileOrders({
    orders,
    transactionsByOrderId,
    accountName: input.accountName ?? "Wix store",
    periodStart: input.periodStart,
    periodEnd: input.periodEnd
  });
}

export async function listOrders(input: {
  accessToken: string;
  periodStart: string;
  periodEnd: string;
  fetcher?: typeof fetch;
}): Promise<WixOrderLike[]> {
  const fetcher = input.fetcher ?? fetch;
  const orders: WixOrderLike[] = [];
  let cursor: string | undefined;

  do {
    const body: Record<string, unknown> = {
      filter: {
        createdDate: {
          $gte: input.periodStart,
          $lte: input.periodEnd
        }
      },
      cursorPaging: {
        limit: 100,
        cursor
      }
    };

    const response = await fetcher(WIX_ORDERS_SEARCH_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    const payload = (await response.json()) as Record<string, unknown>;

    if (!response.ok) {
      throw new Error("Unable to read Wix orders");
    }

    orders.push(...extractArray<WixOrderLike>(payload.orders));
    cursor = extractCursor(payload);
  } while (cursor);

  return orders;
}

export async function getOrderTransactions(input: {
  accessToken: string;
  orderId: string;
  fetcher?: typeof fetch;
}): Promise<WixOrderTransactionsLike> {
  const response = await (input.fetcher ?? fetch)(`${WIX_ORDER_TRANSACTIONS_URL}/${encodeURIComponent(input.orderId)}`, {
    headers: {
      Authorization: `Bearer ${input.accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`Unable to read Wix order transactions for ${input.orderId}`);
  }

  return (await response.json()) as WixOrderTransactionsLike;
}

function extractCursor(payload: Record<string, unknown>): string | undefined {
  const metadata = payload.metadata;
  const pagingMetadata = payload.pagingMetadata;
  const candidates = [metadata, pagingMetadata]
    .filter(isRecord)
    .flatMap((record) => [record.cursors, record.paging, record])
    .filter(isRecord);

  for (const candidate of candidates) {
    const next = candidate.next;
    if (typeof next === "string" && next.length > 0) {
      return next;
    }
  }

  return undefined;
}

function extractArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
