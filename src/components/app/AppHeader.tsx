import Link from "next/link";
import { Logo } from "@/components/landing/Logo";
import { LogoutButton } from "@/components/app/LogoutButton";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/dashboard" aria-label="WAIan dashboard">
          <Logo />
        </Link>
        <LogoutButton />
      </div>
    </header>
  );
}
