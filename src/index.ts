import "dotenv/config";
import express from "express";
import getRawBody from "raw-body";
import { startCardCheckout } from "./paymobService.js";
import { redirectionHandler, processedWebhookHandler } from "./webhook.js";

const app = express();

// JSON body for normal API routes
app.use("/api", express.json());

// 1) Begin card checkout: returns { order_id, payment_key, iframe_url }
app.post("/api/paymob/checkout/card", async (req, res) => {
  try {
    const { amountEGP, customer, merchant_order_id } = req.body || {};
    if (!amountEGP || !customer) {
      return res.status(400).json({ ok: false, message: "amountEGP and customer are required" });
    }

    const result = await startCardCheckout({ amountEGP, customer, merchant_order_id });

    res.json({
      ok: true,
      ...result,
      // If you're using Paymob hosted iFrame
      iframe_url: `https://accept.paymob.com/api/acceptance/iframes/${process.env.PAYMOB_IFRAME_ID}?payment_token=${result.payment_key}`
    });
  } catch (e: any) {
    console.error("checkout error", e?.response?.data || e);
    res.status(500).json({ ok: false, message: "checkout error", detail: e?.message });
  }
});

// 2) Browser return: verify HMAC of the redirection query (GET)
//    Next.js page can call this endpoint with the same query params to get a clean JSON verdict
app.get("/api/paymob/redirection-verify", redirectionHandler);

// 3) Processed webhook (server->server) from Paymob
//    We read raw body first (safe for any signature schemes), then parse JSON.
app.post("/webhooks/paymob", async (req, res, next) => {
  try {
    const raw = await getRawBody(req);
    let parsed: any = {};
    try {
      parsed = JSON.parse(raw.toString("utf8"));
    } catch {
      // fallback: no-op; handler will treat as empty
    }
    (req as any).body = parsed;
    next();
  } catch (err) {
    console.error("raw-body error", err);
    res.status(400).send("invalid body");
  }
}, processedWebhookHandler);

const PORT = Number(process.env.PORT || 8080);
app.listen(PORT, () => {
  console.log(`Paymob service listening on ${PORT}`);
});