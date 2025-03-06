'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function TestSupabasePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/test-supabase');
      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error('Error testing Supabase:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createTable = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch the SQL from the migration file
      const sqlResponse = await fetch('/supabase/migrations/20240601000000_create_saved_communications.sql');
      if (!sqlResponse.ok) {
        throw new Error('Failed to fetch SQL migration file');
      }
      
      const sql = await sqlResponse.text();
      
      // Execute the SQL
      const response = await fetch('/api/execute-sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql }),
      });
      
      const data = await response.json();
      setResult({
        ...result,
        tableCreationResult: data
      });
    } catch (err) {
      console.error('Error creating table:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runTest();
  }, []);

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Supabase Connection Test</h1>
      
      <div className="space-y-4 mb-8">
        <Button onClick={runTest} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Run Test
        </Button>
      </div>
      
      {error && (
        <Card className="mb-6 border-red-500">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      )}
      
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              {result.success ? 'Connection successful' : 'Connection failed'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Supabase Connection:</h3>
                <p>{result.supabaseConnected ? '✅ Connected' : '❌ Failed'}</p>
              </div>
              
              <div>
                <h3 className="font-medium">Projects Table:</h3>
                <p>{result.projectsTableWorking ? '✅ Working' : '❌ Failed'}</p>
                {result.projects && (
                  <pre className="bg-gray-100 p-2 rounded mt-2 text-xs">
                    {JSON.stringify(result.projects, null, 2)}
                  </pre>
                )}
              </div>
              
              <div>
                <h3 className="font-medium">Saved Communications Table:</h3>
                <p>
                  {result.savedCommunicationsTableExists 
                    ? '✅ Table exists' 
                    : '❌ Table does not exist'}
                </p>
                {result.savedCommsError && (
                  <div className="mt-2">
                    <p className="text-red-500 text-sm">Error:</p>
                    <pre className="bg-gray-100 p-2 rounded mt-1 text-xs">
                      {JSON.stringify(result.savedCommsError, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
              
              {!result.savedCommunicationsTableExists && (
                <div className="pt-4">
                  <p className="mb-2">The saved_communications table does not exist. You need to create it.</p>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Please follow the instructions in the MIGRATION_INSTRUCTIONS.md file to create the table.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 