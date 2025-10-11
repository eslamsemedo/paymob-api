import axios from "axios";
const BASE = process.env.PAYMOB_BASE ?? "https://accept.paymob.com/api";
export async function getAuthToken(apiKey) {
    const { data } = await axios.post(`${BASE}/auth/tokens`, { api_key: apiKey });
    return data.token; // "auth_token"
}
export async function createOrder(authToken, params) {
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
export async function createPaymentKey(authToken, params) {
    const { data } = await axios.post(`${BASE}/acceptance/payment_keys`, {
        auth_token: authToken,
        amount_cents: params.amount_cents,
        currency: params.currency,
        order_id: params.order_id,
        billing_data: params.billing_data,
        integration_id: params.integration_id,
        expiration: 3600
    });
    return data.token; // "payment_key"
}
// Optional inquiry to double-check status after redirect/webhook
export async function retrieveTransactionByOrderId(authToken, orderId) {
    const { data } = await axios.get(`${BASE}/ecommerce/orders/${orderId}`, {
        headers: { "Authorization": `Bearer ${authToken}` }
    });
    return data;
}
//# sourceMappingURL=paymobClient.js.map