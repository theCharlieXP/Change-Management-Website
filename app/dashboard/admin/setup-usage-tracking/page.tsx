'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export default function SetupUsageTrackingPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const handleSetupUsageTracking = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/admin/setup-usage-tracking', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to set up usage tracking')
      }

      setSuccess(true)
      toast({
        title: 'Success',
        description: 'Usage tracking has been set up successfully',
        variant: 'default',
      })
    } catch (err) {
      console.error('Error setting up usage tracking:', err)
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
      toast({
        title: 'Error',
        description: 'Failed to set up usage tracking. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Admin: Setup Usage Tracking</h1>
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Setup Usage Tracking</CardTitle>
          <CardDescription>
            This will set up the database tables and functions needed for tracking feature usage.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            This action will:
          </p>
          <ul className="list-disc pl-6 space-y-2 mb-6">
            <li>Create the <code>usage_tracker</code> table if it doesn't exist</li>
            <li>Create the <code>increment_usage</code> function</li>
            <li>Create the <code>reset_usage</code> function</li>
          </ul>
          
          {success && (
            <div className="bg-green-50 p-4 rounded-md flex items-start gap-3 mb-4">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium text-green-800">Setup Completed</p>
                <p className="text-green-700 text-sm">Usage tracking has been set up successfully.</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 p-4 rounded-md flex items-start gap-3 mb-4">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Setup Failed</p>
                <p className="text-red-700 text-sm">{error}</p>
                <p className="text-red-700 text-sm mt-2">
                  You may need to run the SQL manually. See the instructions below.
                </p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Manual Setup Instructions</h3>
              <ol className="list-decimal pl-6 space-y-2">
                <li>Go to your Supabase dashboard</li>
                <li>Open the SQL Editor</li>
                <li>Copy and paste the contents of <code>prisma/migrations/all_usage_migrations.sql</code></li>
                <li>Run the SQL</li>
              </ol>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleSetupUsageTracking} 
            disabled={isLoading || success}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting Up...
              </>
            ) : success ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Setup Complete
              </>
            ) : (
              'Setup Usage Tracking'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 