export function SentimentAILogo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <div
      className={`relative flex items-center justify-center rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20 ${className}`}
    >
      <svg
        className="w-5 h-5 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    </div>
  );
}
