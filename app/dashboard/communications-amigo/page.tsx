'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft, Send, Bot } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Textarea } from "@/components/ui/textarea"

interface Message {
  role: 'user' | 'assistant'
  content: string
}

// This is a standalone page without the dashboard layout
export default function CommunicationsAmigoPage() {
  const router = useRouter()
  const { toast } = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textContainerRef = useRef<HTMLDivElement>(null)
  
  // State for the communication
  const [communication, setCommunication] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [isClient, setIsClient] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [animating, setAnimating] = useState(false)
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  
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
      // Check if we're intentionally navigating to Communications Amigo
      const navigatingToAmigo = sessionStorage.getItem('navigatingToAmigo');
      
      // Get the communication data
      const storedData = sessionStorage.getItem('communicationAmigoData');
      
      // Clear the navigation flag
      sessionStorage.removeItem('navigatingToAmigo');
      
      // If we don't have data and weren't intentionally navigating here, go back to dashboard
      if (!storedData && navigatingToAmigo !== 'true') {
        console.log('No data found and not intentionally navigating here, redirecting to dashboard');
        router.push('/dashboard/communications');
        return;
      }
      
      // If we have data, parse and use it
      if (storedData) {
        const data = JSON.parse(storedData);
        setCommunication(data.communication || '');
        
        // Add initial welcome message
        setMessages([{
          role: 'assistant',
          content: "Hello! I'm your Communications Amigo, a change management expert. I can help you refine and improve your communication. Just tell me what changes you'd like to make, and I'll help you enhance it. What would you like to adjust?"
        }]);
        
        setDataLoaded(true);
      } else {
        // If we were intentionally navigating here but have no data, show an error
        toast({
          title: "Error",
          description: "Failed to load communication data. Please try again.",
          variant: "destructive"
        });
        router.push('/dashboard/communications');
      }
    } catch (error) {
      console.error('Error loading data from sessionStorage:', error);
      toast({
        title: "Error",
        description: "An error occurred while loading data. Please try again.",
        variant: "destructive"
      });
      router.push('/dashboard/communications');
    }
  }, [isClient, router, toast]);
  
  // Function to go back to the communications page
  const handleBack = () => {
    try {
      if (typeof window === 'undefined') return;
      
      // Store the updated communication
      sessionStorage.setItem('updatedCommunication', communication);
      
      // Set a flag to indicate that we're returning from Communications Amigo
      sessionStorage.setItem('returningFromAmigo', 'true');
      
      // Navigate back to the Communications page
      router.push('/dashboard/communications');
    } catch (error) {
      console.error('Error navigating back:', error);
      router.push('/dashboard/communications');
    }
  }

  // Function to animate text with a wave effect
  const animateText = (newText: string) => {
    if (!textContainerRef.current) return;
    
    setAnimating(true);
    
    // Split the text into words
    const words = newText.split(/\s+/);
    const container = textContainerRef.current;
    
    // Clear the container
    container.innerHTML = '';
    
    // Create a wrapper for better control
    const wrapper = document.createElement('div');
    wrapper.className = 'text-wrapper';
    wrapper.style.width = '100%';
    wrapper.style.overflowX = 'hidden';
    wrapper.style.wordBreak = 'break-word';
    container.appendChild(wrapper);
    
    // Create spans for each word with staggered animation
    words.forEach((word, index) => {
      const span = document.createElement('span');
      span.textContent = word + ' ';
      span.style.opacity = '0';
      span.style.transform = 'translateY(20px)';
      span.style.display = 'inline-block';
      span.style.transition = 'all 0.3s ease';
      span.style.maxWidth = '100%';
      span.style.overflowWrap = 'break-word';
      wrapper.appendChild(span);
      
      // Stagger the animation
      setTimeout(() => {
        span.style.opacity = '1';
        span.style.transform = 'translateY(0)';
      }, 30 * index);
    });
    
    // Set a timeout to update the state after animation completes
    setTimeout(() => {
      setCommunication(newText);
      setAnimating(false);
    }, 30 * words.length + 500);
  };

  // Function to handle sending a message
  const handleSendMessage = async () => {
    if (!input.trim() || isProcessing) return;
    
    const userMessage = input.trim();
    setInput('');
    setIsProcessing(true);
    
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
      
      // Animate the updated communication with wave effect
      animateText(data.updatedCommunication);
      
      // Add assistant's response to chat
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.response || "I've updated the communication based on your request. Take a look at the changes and let me know if you'd like any further adjustments."
      }]);
    } catch (error) {
      console.error('Error updating communication:', error);
      toast({
        title: "Error",
        description: "Failed to update the communication. Please try again.",
        variant: "destructive"
      });
      
      // Add error message to chat
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I apologize, but I encountered an error while trying to update the communication. Please try again or rephrase your request."
      }]);
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
    <div className="flex flex-col md:flex-row h-screen w-full max-w-full overflow-hidden bg-gray-50">
      {/* Left sidebar for chat (full width on mobile, 30% on desktop) */}
      <div className="w-full md:w-[40%] lg:w-[35%] h-[50vh] md:h-screen flex flex-col border-b md:border-b-0 md:border-r bg-white">
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            <h1 className="text-xl font-bold">Communications Amigo</h1>
          </div>
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </div>
        
        <div className="flex-1 p-4 overflow-auto">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`rounded-lg px-4 py-2 max-w-[90%] ${
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
              className="min-h-[60px] resize-none"
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
              className="px-3 shrink-0"
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
      
      {/* Right content area for the communication (full width on mobile, 70% on desktop) */}
      <div className="w-full md:w-[60%] lg:w-[65%] h-[50vh] md:h-screen overflow-auto p-3 md:p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="p-4 md:p-6">
              <CardTitle>Your Communication</CardTitle>
              <CardDescription>
                Chat with me on the left to refine your communication. I'll help you make it more effective!
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 md:p-6">
              <div 
                ref={textContainerRef}
                className="bg-white border rounded-md p-4 md:p-6 min-h-[200px] md:min-h-[calc(100vh-300px)] whitespace-pre-line overflow-x-hidden"
              >
                {!animating && communication}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 