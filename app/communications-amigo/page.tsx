'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft, Send, Handshake, Save, CheckCircle } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
// import { ScrollArea } from "@/components/ui/scroll-area"

interface Message {
  role: 'user' | 'assistant'
  content: string
}

// Custom Handshake icon component with hover animation
const HandshakeIcon = ({ className }: { className?: string }) => {
  return (
    <div className="handshake-icon-container">
      <Handshake 
        className={`text-emerald-600 transition-colors duration-500 group-hover:text-emerald-500 ${className}`}
      />
    </div>
  );
};

export default function CommunicationsAmigoPage() {
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // State for the communication
  const [communication, setCommunication] = useState<string>('')
  const [previousCommunication, setPreviousCommunication] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [isClient, setIsClient] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [processingCommunication, setProcessingCommunication] = useState(false)
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Finalize dialog state
  const [showFinalizeDialog, setShowFinalizeDialog] = useState(false)
  const [communicationTitle, setCommunicationTitle] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  
  // Project data
  const [projectId, setProjectId] = useState<string>('')
  const [communicationType, setCommunicationType] = useState<string>('')
  
  // First useEffect just to set isClient to true
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  // Second useEffect to load data from sessionStorage, only runs on client
  useEffect(() => {
    if (!isClient) return;
    
    try {
      // Check if we&apos;re intentionally navigating to Communications Amigo
      const navigatingToAmigo = sessionStorage.getItem('navigatingToAmigo');
      
      // Get the communication data
      const storedData = sessionStorage.getItem('communicationAmigoData');
      
      // Clear the navigation flag
      sessionStorage.removeItem('navigatingToAmigo');
      
      // If we don&apos;t have data and weren&apos;t intentionally navigating here, go back to dashboard
      if (!storedData && navigatingToAmigo !== 'true') {
        console.log('No data found and not intentionally navigating here, redirecting to dashboard');
        router.push('/dashboard/communications');
        return;
      }
      
      // If we have data, parse and use it
      if (storedData) {
        const data = JSON.parse(storedData);
        setCommunication(data.communication || '');
        setCommunicationTitle(data.title || 'Untitled Communication');
        
        // Store project ID and communication type if available
        if (data.projectId) {
          setProjectId(data.projectId);
        }
        if (data.communicationType) {
          setCommunicationType(data.communicationType);
        }
        
        // Add initial welcome message
        setMessages([{
          role: 'assistant',
          content: "Hello! I'm your Communications Amigo, a change management expert. I can help you refine and improve your communication. Just tell me what changes you'd like to make, and I'll help you enhance it. What would you like to adjust?"
        }]);
        
        setDataLoaded(true);
      } else {
        // If we were intentionally navigating here but have no data, show an error
        router.push('/dashboard/communications');
      }
    } catch (error) {
      console.error('Error loading data from sessionStorage:', error);
      router.push('/dashboard/communications');
    }
  }, [isClient, router]);
  
  // Function to go back to the communications page
  const handleBack = () => {
    try {
      if (typeof window === 'undefined') return;
      
      // Store the updated communication if needed
      if (communication.trim()) {
        sessionStorage.setItem('updatedCommunication', communication);
      }
      
      // Clear any flags that might cause returning to customization
      sessionStorage.removeItem('returningFromAmigo');
      
      // Navigate to the communications page
      router.push('/dashboard/communications');
    } catch (error) {
      console.error('Error handling back navigation:', error);
      router.push('/dashboard/communications');
    }
  }
  
  // Function to open the finalize dialog
  const handleOpenFinalizeDialog = () => {
    setShowFinalizeDialog(true);
  }
  
  // Function to save the communication and finalize
  const handleFinalize = async () => {
    if (!communication.trim()) {
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Call the API to save the communication
      const response = await fetch('/api/communications/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: projectId,
          title: communicationTitle || 'Untitled Communication',
          content: communication,
          communicationType: communicationType,
          messages: messages
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save communication');
      }

      const data = await response.json();
      
      // Close the dialog
      setShowFinalizeDialog(false);
      
      // Navigate back to the communications page
      handleBack();
    } catch (error) {
      console.error('Error saving communication:', error);
    } finally {
      setIsSaving(false);
    }
  }

  // Function to handle sending a message
  const handleSendMessage = async () => {
    if (!input.trim() || isProcessing) return;
    
    const userMessage = input.trim();
    setInput('');
    setIsProcessing(true);
    setProcessingCommunication(true);
    
    // Store the current communication before updating
    setPreviousCommunication(communication);
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    
    try {
      // Call the API to process the message and update the communication
      const response = await fetch('/api/communications/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          currentCommunication: communication
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update communication');
      }

      const data = await response.json();
      
      // Update the communication
      setCommunication(data.updatedCommunication);
      
      // First turn off processing state with a slight delay
      setTimeout(() => {
        setProcessingCommunication(false);
      }, 800);
      
      // Add assistant's response to chat
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.response || "I've updated the communication based on your request. Take a look at the changes and let me know if you'd like any further adjustments."
      }]);
    } catch (error) {
      console.error('Error updating communication:', error);
      
      // Add error message to chat
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I apologize, but I encountered an error while trying to update the communication. Please try again or rephrase your request."
      }]);
      
      // Turn off processing state
      setProcessingCommunication(false);
    } finally {
      setIsProcessing(false);
    }
  }
  
  // If not client-side yet, render a loading state
  if (!isClient) {
    return null;
  }
  
  // If client-side but data not loaded yet, show loading indicator
  if (!dataLoaded) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading Communications Amigo...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden communications-amigo-page">
      {/* Left sidebar for chat (30% width) */}
      <div className="w-[30%] h-screen flex flex-col border-r bg-white">
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center gap-2 group">
            <div className="handshake-hover">
              <HandshakeIcon className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold">Communications Amigo</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button variant="default" size="sm" onClick={handleOpenFinalizeDialog} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <CheckCircle className="mr-2 h-4 w-4" /> Finalise
            </Button>
          </div>
        </div>
        
        <div className="flex-1 p-4 overflow-auto">
          <div className="space-y-4 max-h-[calc(100vh-180px)]">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`rounded-lg px-4 py-2 max-w-[80%] ${
                    message.role === 'assistant'
                      ? 'bg-secondary text-secondary-foreground'
                      : 'bg-primary text-primary-foreground'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tell me what changes you'd like to make..."
              className="min-h-[100px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!input.trim() || isProcessing}
              className="px-3 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Right content area for the communication (70% width) */}
      <div className="w-[70%] h-screen overflow-auto p-6">
        <div className="max-w-full mx-auto">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Your Communication</CardTitle>
              <CardDescription>
                Chat with me on the left to refine your communication. I&apos;ll help you make it more effective!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                className={`bg-white border rounded-md p-6 min-h-[calc(100vh-250px)] whitespace-pre-line relative ${
                  processingCommunication ? 'communication-processing' : ''
                }`}
              >
                {processingCommunication ? (
                  <>
                    <div className="absolute top-0 left-0 w-full h-full bg-white/50 flex items-center justify-center z-10">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Updating communication...</p>
                      </div>
                    </div>
                    <div className="communication-text">{communication}</div>
                  </>
                ) : (
                  <div className="communication-text">{communication}</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Finalize Dialog */}
      <Dialog open={showFinalizeDialog} onOpenChange={setShowFinalizeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalise Communication</DialogTitle>
            <DialogDescription>
              Save your communication to access it later from your communications list.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Communication Title</Label>
              <Input
                id="title"
                value={communicationTitle}
                onChange={(e) => setCommunicationTitle(e.target.value)}
                placeholder="Enter a title for your communication"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFinalizeDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleFinalize}
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Communication
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 