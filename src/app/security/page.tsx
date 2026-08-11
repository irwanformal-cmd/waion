import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Security | WAIon",
};

export default function SecurityPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
      <Link href="/" className="text-sm text-emerald-400 hover:underline">
        Back to home
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">
        Security at WAIon
      </h1>
      <div className="mt-8 flex flex-col gap-8 text-sm leading-relaxed text-zinc-400">
        <section>
          <h2 className="text-base font-semibold text-white">Authentication</h2>
          <p className="mt-2">
            Accounts use hashed passwords and email verification. Sessions are
            server-side, encrypted, and revocable. All protected resources are
            validated again on every request.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-white">Data isolation</h2>
          <p className="mt-2">
            Every conversation, message, and usage record is scoped to its
            owner in the database. Cross-account access is rejected before any
            data is returned.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-white">Secrets</h2>
          <p className="mt-2">
            AI provider credentials and the database connection string exist
            only on the server. They are never shipped to the browser or to any
            client application.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-white">Abuse controls</h2>
          <p className="mt-2">
            Request rate limits, daily token budgets, origin checks, and input
            validation are enforced server-side and cannot be bypassed from the
            client.
          </p>
        </section>
      </div>
    </div>
  );
}