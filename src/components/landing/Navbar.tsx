import Link from "next/link";
import { Logo } from "@/components/landing/Logo";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#use-cases", label: "Use cases" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="WAIon home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-zinc-400 transition-colors hover:text-zinc-100"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/login"
            className="rounded-md px-3.5 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
          >
            Get started
          </Link>
        </div>

        <details className="group relative md:hidden">
          <summary
            aria-label="Open menu"
            className="flex size-9 cursor-pointer list-none items-center justify-center rounded-md border border-zinc-800 text-zinc-300 hover:text-white [&::-webkit-details-marker]:hidden"
          >
            <svg
              aria-hidden="true"
              className="size-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </summary>
          <div className="absolute right-0 mt-2 w-52 rounded-lg border border-zinc-800 bg-zinc-900 p-1.5 shadow-xl">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block rounded-md px-3 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-1.5 border-t border-zinc-800 pt-1.5">
              <a
                href="/login"
                className="block rounded-md px-3 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white"
              >
                Log in
              </a>
              <a
                href="/register"
                className="mt-1 block rounded-md bg-emerald-600 px-3 py-2.5 text-center text-sm font-medium text-white hover:bg-emerald-500"
              >
                Get started
              </a>
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}