import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createCheckoutSession } from "@/lib/payments.functions";
import { useServerFn } from "@tanstack/react-start";
import { useCallback } from "react";

interface Props {
  priceId: string;
  customerEmail?: string;
  userId?: string;
  couponCode?: string;
  returnUrl?: string;
}

export function StripeEmbeddedCheckout({
  priceId,
  customerEmail,
  userId,
  couponCode,
  returnUrl,
}: Props) {
  const createSession = useServerFn(createCheckoutSession);
  const fetchClientSecret = useCallback(async (): Promise<string> => {
    const secret = await createSession({
      data: {
        priceId,
        customerEmail,
        userId,
        couponCode,
        returnUrl: returnUrl || `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
        environment: getStripeEnvironment(),
      },
    });
    if (!secret) throw new Error("No client secret returned");
    return secret;
  }, [createSession, priceId, customerEmail, userId, couponCode, returnUrl]);

  return (
    <div id="checkout">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
