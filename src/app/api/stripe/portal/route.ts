import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getStripeClient } from "@/lib/stripe";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.stripeCustomerId) {
      return NextResponse.json(
        { error: "Активная подписка Stripe не найдена" },
        { status: 400 }
      );
    }

    const stripe = getStripeClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    if (!stripe) {
      return NextResponse.json({ error: "Stripe не настроен" }, { status: 503 });
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${appUrl}/learn`,
    });

    return NextResponse.json({ url: portal.url });
  } catch (err) {
    console.error("Stripe portal error:", err);
    return NextResponse.json({ error: "Ошибка открытия биллинг-портала" }, { status: 500 });
  }
}
