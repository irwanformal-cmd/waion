import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | WAIon",
};

const UPDATED = "August 2026";

export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
      <Link href="/" className="text-sm text-emerald-400 hover:underline">
        Back to home
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">
        Terms of Service
      </h1>
      <p className="mt-2 text-sm text-zinc-500">Last updated: {UPDATED}</p>
      <div className="mt-8 flex flex-col gap-8 text-sm leading-relaxed text-zinc-400">
        <section>
          <h2 className="text-base font-semibold text-white">The service</h2>
          <p className="mt-2">
            WAIon provides an AI chat application. Use of the service is subject
            to these terms and to applicable law.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-white">Acceptable use</h2>
          <p className="mt-2">
            You must not use the service to store or generate unlawful content,
            to attempt to access other accounts, or to interfere with the
            operation of the service. Automated abuse is limited by rate
            limits.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-white">Your content</h2>
          <p className="mt-2">
            You retain the rights to content you submit. You are responsible for
            the content you create. AI output may not always be accurate, and
            you should verify important information independently.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-white">Limitation of liability</h2>
          <p className="mt-2">
            The service is provided as is. To the extent permitted by law, WAIon
            is not liable for damages arising from use of the service.
          </p>
        </section>
      </div>
    </div>
  );
}