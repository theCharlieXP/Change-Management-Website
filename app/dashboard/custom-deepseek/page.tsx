'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function CustomDeepSeekPage() {
  const [customPrompt, setCustomPrompt] = useState<string>(DEFAULT_SYSTEM_PROMPT)
  const [content, setContent] = useState<string>('Enter the content to analyze here.')
  const [result, setResult] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    setIsLoading(true)
    setError(null)
    setResult('')

    try {
      const response = await fetch('/api/insights/custom-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customPrompt,
          content,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process request')
      }

      setResult(data.result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Custom DeepSeek Prompt Tester</h1>
      <p className="text-muted-foreground">
        Use this page to test custom DeepSeek prompts without any post-processing.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Prompt</CardTitle>
              <CardDescription>
                Enter your custom system prompt for DeepSeek
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Enter your system prompt..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
              <CardDescription>
                Enter the content to analyze
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Enter content to analyze..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
              />
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleSubmit} 
                disabled={isLoading}
                size="lg"
                className="w-full"
              >
                {isLoading ? 'Processing...' : 'Submit to DeepSeek'}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Raw Results</CardTitle>
              <CardDescription>
                Direct output from DeepSeek without any post-processing
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-auto">
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 p-3 rounded mb-4">
                  Error: {error}
                </div>
              )}
              
              {isLoading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                </div>
              ) : result ? (
                <Tabs defaultValue="raw">
                  <TabsList className="mb-4">
                    <TabsTrigger value="raw">Raw Text</TabsTrigger>
                    <TabsTrigger value="rendered">Rendered Markdown</TabsTrigger>
                  </TabsList>
                  <TabsContent value="raw">
                    <Textarea
                      readOnly
                      value={result}
                      className="min-h-[400px] w-full font-mono text-sm bg-gray-50"
                    />
                  </TabsContent>
                  <TabsContent value="rendered">
                    <div className="prose prose-sm max-w-none min-h-[400px] p-4 border rounded-md bg-white">
                      <div dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(result) }} />
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="text-muted-foreground italic">
                  Results will appear here after submission...
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function convertMarkdownToHtml(markdown: string): string {
  try {
    // Very simple markdown to HTML conversion
    // For a production app, you'd want to use a proper markdown library
    let html = markdown
      // Headers
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      // Bold
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      // Bullet points
      .replace(/^• (.*$)/gim, '<li>$1</li>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      // Links
      .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank">$1</a>')
      // Line breaks
      .replace(/\n/gim, '<br />')
    
    // Wrap lists
    html = html
      .replace(/(<li>.*?<\/li>)(<br \/>)/g, '$1')
      .replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>')
    
    return html
  } catch (error) {
    console.error('Error converting markdown to HTML:', error)
    return `<pre>${markdown}</pre>`
  }
}

// Provide a default system prompt to get started
const DEFAULT_SYSTEM_PROMPT = `You are an expert in change management who provides insightful analysis.
Please analyze the provided content and create a summary in the following format:
# Title (Use Title Case)

## Insights
• Write 7-10 bullet points using the information received from the internet and your own knowledge based on what was searched and what focus area was selected.

## References
[Include any relevant source links if available]

IMPORTANT FORMATTING RULES:
1. DO NOT include a Context section - this is strictly prohibited
2. Only use the exact sections specified above: Title, Insights, and References
3. Make sure to be thorough in your analysis and provide actionable insights in full sentences
4. Write in UK English

Your analysis will be rejected if it includes a Context, Overview, or Background section.`; 