const STEPS = [
  {
    step: "01",
    title: "You send a message",
    description:
      "Input is validated on the server: length, shape, and size limits. Nothing from the client is trusted directly.",
  },
  {
    step: "02",
    title: "Guardrails run first",
    description:
      "Authentication is re-verified, conversation ownership is checked, and token limits are enforced before any model call.",
  },
  {
    step: "03",
    title: "The model answers",
    description:
      "A fixed, server-controlled system prompt goes to the provider. Your message travels as data, never as instructions, and the API key stays on the server.",
  },
  {
    step: "04",
    title: "You stream the result",
    description:
      "The reply streams back token by token, is stored with its usage cost, and renders as safe markdown with no raw HTML.",
  },
];

const GUARDRAILS = [
  "Prompt injection cannot escalate privileges; no tools are exposed to the model.",
  "Providers and models are allowlisted on the server.",
  "Provider failures return safe, generic errors; details stay in server logs.",
  "Daily token quotas live in the database, so clearing browser storage cannot bypass them.",
];

export function AiSection() {
  return (
    <section id="how-it-works" className="border-t border-zinc-800 py-24">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-white">
              How the AI layer stays safe
            </h2>
            <p className="mt-3 text-lg leading-relaxed text-zinc-400">
              AI endpoints are expensive and heavily attacked. WAIon treats
              every message as untrusted input and runs each request through
              server-side controls before, during, and after the model call.
            </p>
            <ul className="mt-8 space-y-3 border-l border-zinc-800 pl-5">
              {GUARDRAILS.map((item) => (
                <li key={item} className="text-sm leading-relaxed text-zinc-400">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <ol className="flex flex-col gap-4">
            {STEPS.map((s) => (
              <li key={s.step} className="flex gap-5 border border-zinc-800 p-5">
                <span className="font-mono text-sm font-medium text-emerald-500">
                  {s.step}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-white">{s.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
                    {s.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}