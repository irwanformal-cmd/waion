import Link from "next/link";

const USE_CASES = [
  {
    title: "Research and analysis",
    description:
      "Summarize documents, compare sources, and explore ideas with a searchable history of every answer.",
  },
  {
    title: "Writing and editing",
    description:
      "Draft copy, refine headlines, and keep a full revision trail you can revisit anytime.",
  },
  {
    title: "Engineering",
    description:
      "Explain code, plan refactors, and generate drafts with clear token costs per request.",
  },
  {
    title: "Operations and support",
    description:
      "Speed up first-draft responses while keeping audit trails of who used what, and when.",
  },
];

const STATS = [
  ["7-day", "session lifetime, refreshed daily"],
  ["100%", "of limits enforced server-side"],
  ["0", "API keys in your browser"],
];

export function Benefits() {
  return (
    <section id="use-cases" className="border-t border-zinc-800 py-24">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 border border-zinc-800 p-8 sm:p-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-white">
              One workspace for real work
            </h2>
            <p className="mt-3 max-w-xl text-lg leading-relaxed text-zinc-400">
              Stop losing AI answers in browser tabs. WAIan keeps every
              conversation organized, measured, and private, so AI output
              becomes work you can actually reuse.
            </p>
            <dl className="mt-10 grid grid-cols-3 gap-6">
              {STATS.map(([value, label]) => (
                <div key={label}>
                  <dt className="text-2xl font-semibold text-emerald-400 sm:text-3xl">
                    {value}
                  </dt>
                  <dd className="mt-1 text-xs leading-snug text-zinc-500 sm:text-sm">
                    {label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <ul className="flex flex-col gap-3">
            {USE_CASES.map((useCase) => (
              <li key={useCase.title} className="border border-zinc-800 p-5">
                <h3 className="text-sm font-semibold text-white">
                  {useCase.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
                  {useCase.description}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-20 flex flex-col items-center gap-3 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Ready to make AI part of your workflow?
          </h2>
          <p className="max-w-md text-zinc-400">
            Create your free account in under a minute. Your data stays yours.
          </p>
          <Link
            href="/register"
            className="mt-4 inline-flex h-11 items-center justify-center rounded-md bg-emerald-600 px-6 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
          >
            Create free account
          </Link>
        </div>
      </div>
    </section>
  );
}