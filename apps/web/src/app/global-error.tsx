"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body className="flex min-h-svh flex-col items-center justify-center gap-4 bg-black px-4 text-center text-white antialiased">
        <p className="text-6xl font-bold text-neutral-500">500</p>
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="max-w-md text-neutral-400">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className="mt-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-neutral-200"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
