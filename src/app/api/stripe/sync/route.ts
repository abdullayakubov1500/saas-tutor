import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { syncUserStripeSubscription } from "@/lib/stripe";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
  }

  if (user.plan === "PRO") {
    return NextResponse.json({ upgraded: false, plan: "PRO" });
  }

  const result = await syncUserStripeSubscription({
    userId: user.id,
    email: user.email,
    stripeCustomerId: user.stripeCustomerId,
  });

  return NextResponse.json(result);
}
