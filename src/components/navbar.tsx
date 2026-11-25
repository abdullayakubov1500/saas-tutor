"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Crown, LogOut, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface NavbarProps {
  user?: {
    name: string;
    email: string;
    plan: string;
  } | null;
}

export function Navbar({ user }: NavbarProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#86612F] text-[#FAFAFA] shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-display text-3xl text-foreground">Slovo AI</span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          <Link href="/learn">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Обучение</span>
            </Button>
          </Link>
          <Link href="/pricing">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <Crown className="h-4 w-4 text-[#86612F]" />
              <span className="hidden sm:inline">Тарифы</span>
            </Button>
          </Link>

          <ThemeToggle />

          {user ? (
            <div className="flex items-center gap-2">
              <Badge variant={user.plan === "PRO" ? "pro" : "secondary"}>
                {user.plan === "PRO" ? "PRO" : "FREE"}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                title="Выйти"
                className="gap-1.5"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden md:inline">Выйти</span>
              </Button>
            </div>
          ) : (
            <Link href="/auth">
              <Button size="sm">Войти</Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
