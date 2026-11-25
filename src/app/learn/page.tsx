import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getUserUsageStatus } from "@/lib/usage";
import { syncUserStripeSubscription } from "@/lib/stripe";
import { Navbar } from "@/components/navbar";
import { PracticeWorkspace } from "@/components/tutor/practice-workspace";

export const instant = false;

export default async function LearnPage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string; session_id?: string }>;
}) {
  let user = await getCurrentUser();
  if (!user) {
    redirect("/auth");
  }

  const params = await searchParams;
  if (
    user.plan !== "PRO" &&
    (params.upgraded === "1" || params.session_id || user.stripeCustomerId)
  ) {
    const sync = await syncUserStripeSubscription({
      userId: user.id,
      email: user.email,
      stripeCustomerId: user.stripeCustomerId,
      sessionId: params.session_id,
    });
    if (sync.upgraded) {
      const refreshed = await getCurrentUser();
      if (refreshed) user = refreshed;
    }
  }

  const usage = await getUserUsageStatus(user.id, user.plan);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar user={user} />
      <main className="flex-1">
        <PracticeWorkspace initialUser={user} initialUsage={usage} />
      </main>
    </div>
  );
}
