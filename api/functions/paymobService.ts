import { getAuthToken, createOrder, createPaymentKey } from "./paymobClient.js";

export async function startCardCheckout(input: {
  amountEGP: number;
  customer: { first_name: string; last_name: string; email: string; phone_number: string; };
  merchant_order_id?: string;
}) {
  const apiKey = process.env.PAYMOB_API_KEY!;
  const auth = await getAuthToken(apiKey);

  const order = await createOrder(auth, {
    amount_cents: Math.round(input.amountEGP * 100),
    currency: "EGP",
    merchant_order_id: input.merchant_order_id
  });

  const billing = {
    apartment: "NA", floor: "NA", street: "NA", building: "NA",
    first_name: input.customer.first_name, last_name: input.customer.last_name,
    email: input.customer.email, phone_number: input.customer.phone_number,
    city: "Cairo", country: "EG", state: "Cairo", shipping_method: "NA", postal_code: "00000"
  };

  const integration_id = parseInt(process.env.PAYMOB_CARD_INTEGRATION_ID!, 10);
  const paymentKey = await createPaymentKey(auth, {
    order_id: order.id,
    amount_cents: Math.round(input.amountEGP * 100),
    currency: "EGP",
    billing_data: billing,
    integration_id
  });

  return { order_id: order.id, payment_key: paymentKey };
}