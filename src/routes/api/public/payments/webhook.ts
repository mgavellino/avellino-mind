import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";

let _supabase: any = null;
function getSupabase(): any {
  if (!_supabase) {
    _supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }
  return _supabase;
}

// Resolve plan_id by looking up plans.stripe_price_id — single source of truth.
async function planIdFromPriceId(priceId: string | null | undefined): Promise<string | null> {
  if (!priceId) return null;
  const { data } = await getSupabase()
    .from("plans")
    .select("id")
    .eq("stripe_price_id", priceId)
    .maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

// Map Stripe subscription status → our enum.
function mapStatus(stripeStatus: string): "active" | "cancelled" | "past_due" | "trial" {
  if (stripeStatus === "active" || stripeStatus === "trialing") return "active";
  if (stripeStatus === "canceled") return "cancelled";
  if (stripeStatus === "past_due" || stripeStatus === "unpaid") return "past_due";
  return "active";
}

// When a NEW active subscription lands, cancel any prior trial / older sub
// for the same user+env so we never have multiple "active" rows.
async function deactivateOtherSubs(userId: string, env: StripeEnv, keepStripeId: string) {
  await getSupabase()
    .from("subscriptions")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("environment", env)
    .neq("stripe_subscription_id", keepStripeId)
    .in("status", ["trial", "active", "past_due"]);
}

async function handleSubscriptionUpsert(subscription: any, env: StripeEnv) {
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  const item = subscription.items?.data?.[0];
  const priceId =
    item?.price?.lookup_key ||
    item?.price?.metadata?.lovable_external_id ||
    subscription.metadata?.priceId ||
    item?.price?.id;
  const productId = item?.price?.product;
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;
  const planId = await planIdFromPriceId(priceId);
  const status = mapStatus(subscription.status);

  await getSupabase().from("subscriptions").upsert(
    {
      user_id: userId,
      plan_id: planId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      product_id: productId,
      price_id: priceId,
      status,
      gateway: "stripe",
      starts_at: periodStart
        ? new Date(periodStart * 1000).toISOString()
        : new Date().toISOString(),
      expires_at: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" },
  );

  if (status === "active") {
    await deactivateOtherSubs(userId, env, subscription.id);
  }

  const dbCouponId = subscription.metadata?.dbCouponId;
  if (dbCouponId) {
    const { data: cp } = await getSupabase()
      .from("coupons")
      .select("redemptions_count")
      .eq("id", dbCouponId)
      .maybeSingle();
    if (cp) {
      await getSupabase()
        .from("coupons")
        .update({
          redemptions_count: ((cp as { redemptions_count: number }).redemptions_count ?? 0) + 1,
        })
        .eq("id", dbCouponId);
      await getSupabase().from("coupon_redemptions").insert({
        coupon_id: dbCouponId,
        user_id: userId,
      });
    }
  }
}

async function handleSubscriptionDeleted(subscription: any, env: StripeEnv) {
  await getSupabase()
    .from("subscriptions")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env);
}

async function handleCheckoutCompleted(session: any, env: StripeEnv) {
  const userId = session.metadata?.userId;
  if (!userId) return;

  await getSupabase().from("payments").insert({
    user_id: userId,
    amount_cents: session.amount_total ?? 0,
    currency: (session.currency ?? "brl").toUpperCase(),
    status: "approved",
    gateway: "stripe",
    gateway_payment_id: session.payment_intent ?? session.id,
    stripe_session_id: session.id,
    environment: env,
    paid_at: new Date().toISOString(),
    description: session.metadata?.description ?? "Assinatura Stripe",
  });

  // For one-time payments (vitalício), create subscription row from session
  if (session.mode === "payment") {
    const priceId = session.metadata?.priceId;
    const planId = await planIdFromPriceId(priceId);
    if (planId) {
      await getSupabase().from("subscriptions").insert({
        user_id: userId,
        plan_id: planId,
        gateway: "stripe",
        status: "lifetime",
        starts_at: new Date().toISOString(),
        expires_at: null,
        environment: env,
        stripe_customer_id: session.customer,
        price_id: priceId,
      });
      // Cancel trial / prior subs
      await getSupabase()
        .from("subscriptions")
        .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("environment", env)
        .neq("price_id", priceId)
        .in("status", ["trial", "active", "past_due"]);
    }
  }
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await handleSubscriptionUpsert(event.data.object, env);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object, env);
      break;
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object, env);
      break;
    default:
      console.log("Unhandled event:", event.type);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          return Response.json({ received: true, ignored: "invalid env" });
        }
        try {
          await handleWebhook(request, rawEnv);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
