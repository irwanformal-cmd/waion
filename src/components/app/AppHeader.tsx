import Link from "next/link";
import { Logo } from "@/components/landing/Logo";
import { LogoutButton } from "@/components/app/LogoutButton";
import type { SessionUserDto } from "@wai/shared";

export function AppHeader({ user }: { user?: SessionUserDto }) {
  const initial = user?.name?.trim().charAt(0).toUpperCase() ?? "W";

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/dashboard" aria-label="WAIon dashboard" className="shrink-0">
          <Logo />
        </Link>

        {user ? (
          <div className="flex min-w-0 items-center gap-3">
            <div className="hidden min-w-0 items-center gap-2.5 sm:flex">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-emerald-600/40 bg-emerald-600/10 text-sm font-semibold text-emerald-400">
                {initial}
              </div>
              <div className="min-w-0 leading-tight">
                <p className="truncate text-sm font-medium text-zinc-200">{user.name}</p>
                <p className="truncate text-xs text-zinc-500">{user.email}</p>
              </div>
            </div>
            <LogoutButton />
          </div>
        ) : (
          <Link
            href="/login"
            className="shrink-0 rounded-md px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            Log in
          </Link>
        )}
      </div>
    </header>
  );
}