import { Logo } from "@/components/landing/Logo";
import { getWhatsAppSupportHref } from "@/lib/support/whatsapp";

const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "How it works", href: "#how-it-works" },
      { label: "Use cases", href: "#use-cases" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Log in", href: "/login" },
      { label: "Create account", href: "/register" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Security", href: "/security" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

export function Footer() {
  const supportHref = getWhatsAppSupportHref();

  return (
    <footer className="border-t border-zinc-800 py-14">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-zinc-500">
              AI chat with the security posture of a financial product.
            </p>
          </div>
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold text-white">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-zinc-500 transition-colors hover:text-zinc-200"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
                {column.title === "Company" && supportHref ? (
                  <li>
                    <a
                      href={supportHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-zinc-500 transition-colors hover:text-emerald-400"
                    >
                      Contact support
                    </a>
                  </li>
                ) : null}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-zinc-800 pt-6 sm:flex-row">
          <p className="text-xs text-zinc-600">
            © {new Date().getFullYear()} WAIon. All rights reserved.
          </p>
          <p className="text-xs text-zinc-600">
            No plaintext passwords. Keys never leave the server.
          </p>
        </div>
      </div>
    </footer>
  );
}