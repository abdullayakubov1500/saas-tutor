import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getStripeClient } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Необходимо войти в аккаунт" }, { status: 401 });
    }

    const stripe = getStripeClient();
    const priceId = process.env.STRIPE_PRO_PRICE_ID?.trim();
    const origin = request.headers.get("origin");
    const appUrl = origin || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    if (!stripe || !priceId) {
      return NextResponse.json(
        {
          error:
            "Stripe не настроен. Укажите STRIPE_SECRET_KEY и STRIPE_PRO_PRICE_ID в .env для приема платежей.",
        },
        { status: 503 }
      );
    }

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/learn?upgraded=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing?canceled=1`,
      metadata: { userId: user.id },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json({ error: "Не удалось создать сессию оплаты" }, { status: 500 });
  }
}
