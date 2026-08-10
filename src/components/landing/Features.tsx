const FEATURES = [
  {
    title: "Secure accounts",
    description:
      "Password hashing, email verification, and server-side sessions you can revoke at any time.",
  },
  {
    title: "Saved conversations",
    description:
      "Every chat is stored on your account, so history follows you across devices.",
  },
  {
    title: "Transparent usage",
    description:
      "See token consumption against a daily budget that is enforced server-side, not hidden in the UI.",
  },
  {
    title: "Streaming replies",
    description:
      "Answers arrive token by token, so you can start reading while the model finishes writing.",
  },
  {
    title: "Safe rich output",
    description:
      "Markdown renders without raw HTML. Malicious input is treated as data, never as instructions.",
  },
  {
    title: "Privacy by design",
    description:
      "Delete your account and every message, conversation, and usage record goes with it.",
  },
];

export function Features() {
  return (
    <section id="features" className="border-t border-zinc-800 py-24">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight text-white">
            Everything a serious team needs
          </h2>
          <p className="mt-3 text-lg text-zinc-400">
            Security, privacy, and control built into every conversation.
          </p>
        </div>

        <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-zinc-800 bg-zinc-800 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="bg-zinc-950 p-6">
              <h3 className="text-sm font-semibold text-white">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}