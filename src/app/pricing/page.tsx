import { getCurrentUser } from "@/lib/auth";
import { Navbar } from "@/components/navbar";
import { PricingCards } from "@/components/pricing-cards";

export const instant = false;

export default async function PricingPage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar user={user} />
      <main className="flex-1 mx-auto max-w-6xl w-full px-4 sm:px-6 py-14 space-y-10">
        <div className="text-center space-y-3">
          <h1 className="font-display text-5xl sm:text-6xl">Выберите свой тариф</h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
            Free обновляется каждый день в полночь (00:00). Pro снимает все ограничения и открывает
            проверку произношения, Speaking, Listening и подробный разбор ошибок.
          </p>
        </div>

        <PricingCards currentPlan={user?.plan} isAuthenticated={Boolean(user)} />
      </main>
    </div>
  );
}
