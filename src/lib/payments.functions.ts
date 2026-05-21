import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { type StripeEnv, createStripeClient } from "@/lib/stripe.server";

async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string; userId?: string },
): Promise<string> {
  if (options.userId && !/^[a-zA-Z0-9_-]+$/.test(options.userId)) {
    throw new Error("Invalid userId");
  }
  if (options.userId) {
    const found = await stripe.customers.search({
      query: `metadata['userId']:'${options.userId}'`,
      limit: 1,
    });
    if (found.data.length) return found.data[0].id;
  }
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    if (existing.data.length) {
      const customer = existing.data[0];
      if (options.userId && customer.metadata?.userId !== options.userId) {
        await stripe.customers.update(customer.id, {
          metadata: { ...customer.metadata, userId: options.userId },
        });
      }
      return customer.id;
    }
  }
  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    ...(options.userId && { metadata: { userId: options.userId } }),
  });
  return created.id;
}

async function resolveCoupon(
  stripe: ReturnType<typeof createStripeClient>,
  couponCode: string,
): Promise<{ stripeCouponId: string; dbId: string } | null> {
  const supabase: any = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const { data } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", couponCode.toUpperCase())
    .eq("is_active", true)
    .maybeSingle();

  if (!data) return null;
  const c = data as {
    id: string;
    code: string;
    discount_type: string;
    discount_value: number;
    expires_at: string | null;
    max_redemptions: number | null;
    redemptions_count: number;
  };
  if (c.expires_at && new Date(c.expires_at) < new Date()) return null;
  if (c.max_redemptions && c.redemptions_count >= c.max_redemptions) return null;

  const stripeCouponId = `coup_${c.code.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
  try {
    await stripe.coupons.retrieve(stripeCouponId);
  } catch {
    await stripe.coupons.create({
      id: stripeCouponId,
      duration: "once",
      ...(c.discount_type === "percent"
        ? { percent_off: c.discount_value }
        : { amount_off: c.discount_value, currency: "brl" }),
      name: c.code,
    });
  }
  return { stripeCouponId, dbId: c.id };
}

const checkoutInput = z.object({
  priceId: z.string().regex(/^[a-zA-Z0-9_-]+$/),
  customerEmail: z.string().email().optional(),
  userId: z.string().optional(),
  returnUrl: z.string().url(),
  couponCode: z.string().min(2).max(40).optional(),
  environment: z.enum(["sandbox", "live"]),
});

export const createCheckoutSession = createServerFn({ method: "POST" })
  .inputValidator((data: z.infer<typeof checkoutInput>) => checkoutInput.parse(data))
  .handler(async ({ data }) => {
    const stripe = createStripeClient(data.environment);

    const prices = await stripe.prices.list({ lookup_keys: [data.priceId] });
    if (!prices.data.length) throw new Error("Price not found");
    const stripePrice = prices.data[0];
    const isRecurring = stripePrice.type === "recurring";

    const customerId =
      data.customerEmail || data.userId
        ? await resolveOrCreateCustomer(stripe, {
            email: data.customerEmail,
            userId: data.userId,
          })
        : undefined;

    let productDescription: string | undefined;
    if (!isRecurring) {
      const productId =
        typeof stripePrice.product === "string"
          ? stripePrice.product
          : (stripePrice.product as { id: string }).id;
      const product = await stripe.products.retrieve(productId);
      productDescription = product.name;
    }

    let discounts: { coupon: string }[] | undefined;
    let dbCouponId: string | undefined;
    if (data.couponCode) {
      const resolved = await resolveCoupon(stripe, data.couponCode);
      if (resolved) {
        discounts = [{ coupon: resolved.stripeCouponId }];
        dbCouponId = resolved.dbId;
      }
    }

    const baseMetadata: Record<string, string> = {
      priceId: data.priceId,
      ...(data.userId && { userId: data.userId }),
      ...(dbCouponId && { dbCouponId }),
    };

    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: stripePrice.id, quantity: 1 }],
      mode: isRecurring ? "subscription" : "payment",
      ui_mode: "embedded_page",
      return_url: data.returnUrl,
      ...(customerId && { customer: customerId }),
      ...(discounts && { discounts }),
      ...(!isRecurring && {
        payment_intent_data: { description: productDescription },
      }),
      metadata: baseMetadata,
      ...(isRecurring && {
        subscription_data: { metadata: baseMetadata },
      }),
    });

    return session.client_secret;
  });
