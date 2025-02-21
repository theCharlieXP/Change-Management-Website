import Link from 'next/link';

export default function Cancel() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Payment Cancelled
          </h1>
          <p className="text-gray-600 mb-8">
            Your payment was cancelled. You can try again whenever you're ready.
          </p>
          <Link
            href="/"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
} 