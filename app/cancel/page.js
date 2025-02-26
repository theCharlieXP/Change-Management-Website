import Link from 'next/link';
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Cancel() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Payment Cancelled
          </h1>
          <p className="text-gray-600 mb-8">
            Your payment was cancelled. You can try again whenever you're ready.
          </p>
          
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 justify-center">
            <Button
              asChild
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Link href="/dashboard/account">
                Try Again
              </Link>
            </Button>
            
            <Button
              asChild
              variant="outline"
            >
              <Link href="/dashboard">
                Return to Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 