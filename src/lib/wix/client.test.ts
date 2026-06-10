import { describe, expect, it, vi } from "vitest";
import { fetchWixInstanceId, getOrderTransactions, listOrders } from "./client";

describe("Wix client", () => {
  it("reads paginated orders using bearer auth and date filters", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ orders: [{ id: "one" }], metadata: { cursors: { next: "cursor-2" } } }))
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ orders: [{ id: "two" }], metadata: { cursors: {} } })));

    const orders = await listOrders({
      accessToken: "token",
      periodStart: "2026-06-01",
      periodEnd: "2026-06-10",
      fetcher: fetcher as unknown as typeof fetch
    });

    expect(orders).toEqual([{ id: "one" }, { id: "two" }]);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[0][1]?.headers).toMatchObject({ Authorization: "Bearer token" });
    expect(JSON.parse(String(fetcher.mock.calls[0][1]?.body))).toMatchObject({
      filter: {
        createdDate: {
          $gte: "2026-06-01",
          $lte: "2026-06-10"
        }
      }
    });
  });

  it("reads order transactions from the documented endpoint", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ orderTransactions: { payments: [] } })));

    await getOrderTransactions({
      accessToken: "token",
      orderId: "order/123",
      fetcher: fetcher as unknown as typeof fetch
    });

    expect(fetcher.mock.calls[0][0]).toBe("https://www.wixapis.com/ecom/v1/payments/orders/order%2F123");
    expect(fetcher.mock.calls[0][1]?.headers).toMatchObject({ Authorization: "Bearer token" });
  });

  it("resolves a signed iframe instance token to an app instance ID", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ instanceId: "app-instance-123" })));

    await expect(
      fetchWixInstanceId({
        instanceToken: "signed-instance-token",
        fetcher: fetcher as unknown as typeof fetch
      })
    ).resolves.toBe("app-instance-123");

    expect(fetcher.mock.calls[0][0]).toBe("https://www.wixapis.com/oauth2/token-info");
    expect(JSON.parse(String(fetcher.mock.calls[0][1]?.body))).toEqual({ token: "signed-instance-token" });
  });
});
