import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export function getStripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key);
}

/**
 * Синхронизирует статус подписки пользователя со Stripe
 * (резервный механизм на случай задержки или отсутствия webhook).
 */
export async function syncUserStripeSubscription(params: {
  userId: string;
  email: string;
  stripeCustomerId: string | null;
  sessionId?: string | null;
}): Promise<{ upgraded: boolean; plan: "FREE" | "PRO" }> {
  const stripe = getStripeClient();
  if (!stripe) return { upgraded: false, plan: "FREE" };

  let customerId = params.stripeCustomerId;

  if (params.sessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(params.sessionId);
      const sessionUserId = session.metadata?.userId;
      const sessionCustomer =
        typeof session.customer === "string" ? session.customer : null;

      const belongsToUser =
        sessionUserId === params.userId ||
        (customerId && sessionCustomer === customerId);

      if (
        belongsToUser &&
        (session.payment_status === "paid" || session.status === "complete")
      ) {
        const subscriptionId =
          typeof session.subscription === "string" ? session.subscription : null;

        await prisma.user.update({
          where: { id: params.userId },
          data: {
            plan: "PRO",
            stripeCustomerId: sessionCustomer ?? customerId,
            stripeSubscriptionId: subscriptionId,
            subscriptionStatus: "active",
          },
        });
        return { upgraded: true, plan: "PRO" };
      }
    } catch (err) {
      console.error("Stripe session retrieve error:", err);
    }
  }

  if (!customerId) {
    const customers = await stripe.customers.list({
      email: params.email,
      limit: 1,
    });
    customerId = customers.data[0]?.id ?? null;
  }

  if (!customerId) {
    return { upgraded: false, plan: "FREE" };
  }

  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 5,
    });

    const activeSub = subscriptions.data.find(
      (sub) => sub.status === "active" || sub.status === "trialing"
    );

    if (activeSub) {
      await prisma.user.update({
        where: { id: params.userId },
        data: {
          plan: "PRO",
          stripeCustomerId: customerId,
          stripeSubscriptionId: activeSub.id,
          subscriptionStatus: activeSub.status,
        },
      });
      return { upgraded: true, plan: "PRO" };
    }
  } catch (err) {
    console.error("Stripe subscription sync error:", err);
  }

  return { upgraded: false, plan: "FREE" };
}
