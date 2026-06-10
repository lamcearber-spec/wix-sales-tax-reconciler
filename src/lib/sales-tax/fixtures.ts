import { reconcileOrders } from "./reconcile";
import type { WixOrderLike, WixOrderTransactionsLike } from "./types";

export const demoOrders: WixOrderLike[] = [
  {
    id: "ord_ca_clean",
    number: 1401,
    createdDate: "2026-05-14T13:12:00.000Z",
    currency: "USD",
    shippingInfo: {
      logistics: {
        shippingDestination: {
          address: {
            subdivision: "US-CA",
            postalCode: "94107",
            country: "US"
          }
        }
      }
    },
    lineItems: [
      {
        id: "li_1",
        name: "Ceramic lamp",
        quantity: 1,
        taxDetails: {
          taxableAmount: { amount: "100.00" },
          taxRate: "8.625",
          totalTax: { amount: "8.63" }
        }
      }
    ],
    priceSummary: {
      total: { amount: "108.63" },
      tax: { amount: "8.63" }
    }
  },
  {
    id: "ord_ny_drift",
    number: 1402,
    createdDate: "2026-06-03T09:31:00.000Z",
    currency: "USD",
    shippingInfo: {
      logistics: {
        shippingDestination: {
          address: {
            subdivision: "US-NY",
            postalCode: "10013",
            country: "US"
          }
        }
      }
    },
    lineItems: [
      {
        id: "li_2",
        name: "Office shelf",
        quantity: 1,
        taxDetails: {
          taxableAmount: { amount: "200.00" },
          taxRate: "7.50",
          totalTax: { amount: "15.00" }
        }
      }
    ],
    priceSummary: {
      total: { amount: "215.00" },
      tax: { amount: "15.00" }
    }
  },
  {
    id: "ord_tx_untaxed",
    number: 1403,
    createdDate: "2026-05-22T16:18:00.000Z",
    currency: "USD",
    shippingInfo: {
      logistics: {
        shippingDestination: {
          address: {
            subdivision: "US-TX",
            postalCode: "73301",
            country: "US"
          }
        }
      }
    },
    lineItems: [
      {
        id: "li_3",
        name: "Taxable subscription kit",
        quantity: 1,
        taxDetails: {
          taxableAmount: { amount: "120.00" },
          taxRate: "0",
          totalTax: { amount: "0.00" }
        }
      }
    ],
    priceSummary: {
      total: { amount: "120.00" },
      tax: { amount: "0.00" }
    }
  },
  {
    id: "ord_fl_over",
    number: 1404,
    createdDate: "2026-05-25T11:04:00.000Z",
    currency: "USD",
    shippingInfo: {
      logistics: {
        shippingDestination: {
          address: {
            subdivision: "US-FL",
            postalCode: "33131",
            country: "US"
          }
        }
      }
    },
    lineItems: [
      {
        id: "li_4",
        name: "Workshop pack",
        quantity: 1,
        taxDetails: {
          taxableAmount: { amount: "80.00" },
          taxRate: "10.00",
          totalTax: { amount: "8.00" }
        }
      }
    ],
    priceSummary: {
      total: { amount: "88.00" },
      tax: { amount: "8.00" }
    }
  }
];

export const demoTransactions: Record<string, WixOrderTransactionsLike> = {
  ord_ca_clean: {
    orderTransactions: {
      payments: [{ amount: { amount: "108.63" } }],
      refunds: []
    }
  },
  ord_ny_drift: {
    orderTransactions: {
      payments: [{ amount: { amount: "215.00" } }],
      refunds: []
    }
  },
  ord_tx_untaxed: {
    orderTransactions: {
      payments: [{ amount: { amount: "120.00" } }],
      refunds: []
    }
  },
  ord_fl_over: {
    orderTransactions: {
      payments: [{ amount: { amount: "88.00" } }],
      refunds: []
    }
  }
};

export const demoReport = reconcileOrders({
  orders: demoOrders,
  transactionsByOrderId: demoTransactions,
  accountName: "Wix demo store",
  periodStart: "2026-05-01",
  periodEnd: "2026-06-10",
  generatedAt: "2026-06-10T08:00:00.000Z"
});
