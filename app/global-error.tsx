'use client'
 
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
          <h2 className="text-2xl font-bold text-red-600">Something went wrong!</h2>
          <p className="text-gray-600">{error.message || 'An unexpected error occurred'}</p>
          <button
            className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
            onClick={() => reset()}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
