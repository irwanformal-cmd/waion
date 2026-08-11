import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | WAIon",
};

const UPDATED = "August 2026";

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
      <Link href="/" className="text-sm text-emerald-400 hover:underline">
        Back to home
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-zinc-500">Last updated: {UPDATED}</p>
      <div className="mt-8 flex flex-col gap-8 text-sm leading-relaxed text-zinc-400">
        <section>
          <h2 className="text-base font-semibold text-white">What we store</h2>
          <p className="mt-2">
            WAIon stores your email, name, password hash, sessions, conversations,
            messages, and daily token usage. We do not store plaintext passwords.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-white">How it is used</h2>
          <p className="mt-2">
            Your conversations are used to display your chat history and to send
            the current conversation to the AI provider you are chatting with.
            Usage data is used to enforce your daily token budget.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-white">What we do not do</h2>
          <p className="mt-2">
            We do not sell your data. We do not share your conversations with
            third parties beyond the AI provider required to answer your request.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-white">Contact</h2>
          <p className="mt-2">
            For privacy questions, contact the WAIon team through the support
            channels listed on this website.
          </p>
        </section>
      </div>
    </div>
  );
}