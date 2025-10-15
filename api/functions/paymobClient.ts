import axios from "axios";
const BASE = process.env.PAYMOB_BASE ?? "https://accept.paymob.com/api";

export async function getAuthToken(apiKey: string) {
  const { data } = await axios.post(`${BASE}/auth/tokens`, { api_key: apiKey });
  return data.token as string; // "auth_token"
}

export async function createOrder(authToken: string, params: {
  amount_cents: number;
  currency: string;
  merchant_order_id?: string;
  items?: any[];
}) {
  const { data } = await axios.post(`${BASE}/ecommerce/orders`, {
    auth_token: authToken,
    delivery_needed: false,
    amount_cents: params.amount_cents,
    currency: params.currency,
    merchant_order_id: params.merchant_order_id,
    items: params.items ?? []
  });
  return data; // includes id
}

export async function createPaymentKey(authToken: string, params: {
  order_id: number | string;
  amount_cents: number;
  currency: string;
  billing_data: Record<string, string>;
  integration_id: number;
}) {
  const { data } = await axios.post(`${BASE}/acceptance/payment_keys`, {
    auth_token: authToken,
    amount_cents: params.amount_cents,
    currency: params.currency,
    order_id: params.order_id,
    billing_data: params.billing_data,
    integration_id: params.integration_id,
    expiration: 3600
  });
  return data.token as string; // "payment_key"
}

// Optional inquiry to double-check status after redirect/webhook
export async function retrieveTransactionByOrderId(authToken: string, orderId: number | string) {
  const { data } = await axios.get(`${BASE}/ecommerce/orders/${orderId}`, {
    headers: { "Authorization": `Bearer ${authToken}` }
  });
  return data;
}