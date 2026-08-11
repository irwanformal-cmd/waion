export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        aria-hidden="true"
        viewBox="0 0 32 32"
        className="size-7 shrink-0 text-emerald-500"
        fill="none"
      >
        <path
          d="M6.5 8.5 11.5 24 16 13.5 20.5 24 25.5 8.5"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6.5 16.75h19"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
      <span className="text-lg font-semibold tracking-tight text-white">
        WAI<span className="text-emerald-400">on</span>
      </span>
    </span>
  );
}