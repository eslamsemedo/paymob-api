import crypto from "crypto";
/**
 * Helper to access nested keys like "order.id"
 */
function deepGet(obj, dotted) {
    return dotted.split(".").reduce((o, k) => (o ? o[k] : undefined), obj);
}
/**
 * Compute HMAC with a specific ordered list of fields.
 */
function computeHmac(params, orderedKeys, secret) {
    const concatenated = orderedKeys
        .map((k) => String(deepGet(params, k) ?? ""))
        .join("");
    return crypto.createHmac("sha512", secret).update(concatenated).digest("hex");
}
/**
 * Field order for REDIRECTION (user browser returns to your site).
 * Verify against your region’s Paymob docs; adjust if needed.
 */
const REDIRECTION_KEYS = [
    "amount_cents",
    "created_at",
    "currency",
    "error_occured",
    "has_parent_transaction",
    "id",
    "integration_id",
    "is_3d_secure",
    "is_auth",
    "is_capture",
    "is_refunded",
    "is_standalone_payment",
    "is_voided",
    "order.id",
    "owner",
    "pending",
    "source_data.pan",
    "source_data.sub_type",
    "success",
];
/**
 * Field order for PROCESSED WEBHOOK (server-to-server post from Paymob).
 * Verify against your region’s Paymob docs; adjust if needed.
 */
const PROCESSED_KEYS = [
    "amount_cents",
    "created_at",
    "currency",
    "error_occured",
    "has_parent_transaction",
    "id",
    "integration_id",
    "is_3d_secure",
    "is_auth",
    "is_capture",
    "is_refunded",
    "is_standalone_payment",
    "is_voided",
    "order.id",
    "owner",
    "pending",
    "source_data.pan",
    "source_data.sub_type",
    "success",
];
/**
 * GET /api/paymob/redirection-verify
 * Validates Paymob redirection callback (query params) and returns a clean JSON result.
 */
export function redirectionHandler(req, res) {
    const secret = process.env.PAYMOB_HMAC;
    if (!secret)
        return res.status(500).json({ ok: false, message: "Missing PAYMOB_HMAC" });
    // Normalize query (express can give string | string[])
    const qp = Object.fromEntries(Object.entries(req.query).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
    const provided = String(qp.hmac || "");
    const computed = computeHmac(qp, REDIRECTION_KEYS, secret);
    const verified = provided && provided === computed;
    if (!verified) {
        return res.status(400).json({ ok: false, verified: false, message: "Invalid HMAC" });
    }
    const success = String(qp.success) === "true";
    return res.json({
        ok: true,
        verified: true,
        success,
        tx_id: qp.id ?? null,
        order_id: deepGet(qp, "order.id") ?? null,
        amount_cents: qp.amount_cents ?? null,
        currency: qp.currency ?? "EGP",
    });
}
/**
 * POST /webhooks/paymob
 * Validates Paymob processed webhook (JSON body) and returns 200/400.
 * Add your fulfillment logic where indicated.
 */
export function processedWebhookHandler(req, res) {
    const secret = process.env.PAYMOB_HMAC;
    if (!secret)
        return res.status(500).send("Missing PAYMOB_HMAC");
    const payload = req.body || {};
    const provided = String(payload.hmac || "");
    const computed = computeHmac(payload, PROCESSED_KEYS, secret);
    const verified = provided && provided === computed;
    if (!verified) {
        return res.status(400).send("Invalid HMAC");
    }
    // ---- Your fulfillment logic here ----
    // Example:
    // const isSuccess = payload.success === true;
    // const orderId = deepGet(payload, "order.id");
    // if (isSuccess) markOrderPaid(orderId, payload.id);
    // else markOrderFailed(orderId, payload.id, payload.data?.message);
    return res.status(200).send("ok");
}
//# sourceMappingURL=webhook.js.map