import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Not Found</h2>
      <p className="mb-4">Could not find the requested communication.</p>
      <Link 
        href="/dashboard/communications"
        className="text-blue-500 hover:underline"
      >
        Return to Communications
      </Link>
    </div>
  )
} 