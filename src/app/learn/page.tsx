import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getUserUsageStatus } from "@/lib/usage";
import { Navbar } from "@/components/navbar";
import { PracticeWorkspace } from "@/components/tutor/practice-workspace";

export const instant = false;

export default async function LearnPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth");
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
