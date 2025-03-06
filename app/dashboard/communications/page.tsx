'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Loader2, MessageSquare, FileText, Send, ArrowLeft, ArrowRight, Maximize2, X, Highlighter, RefreshCw, Wand2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from '@clerk/nextjs'
import type { Project } from '@/types/projects'
import type { InsightSummary } from '@/types/insights'
import { CreateProjectDialog } from '@/components/projects/create-project-dialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { INSIGHT_FOCUS_AREAS, InsightFocusArea } from '@/types/insights'
import { InsightSelection } from '@/components/communications/insight-selection'
import { CommunicationTypeSelection, CommunicationType, CommunicationTypeOption } from '@/components/communications/communication-type-selection'
import { CommunicationCustomization } from '@/components/communications/communication-customization'
import { ReviewConfirmation } from '@/components/communications/review-confirmation'
import { HighlightText } from '@/components/communications/highlight-text'
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Import the communicationTypes array
import { communicationTypes } from '@/components/communications/communication-type-selection'

export default function CommunicationsPage() {
  const { isLoaded, isSignedIn } = useAuth()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const { userId } = useAuth()
  
  // Add state for client-side detection
  const [isClient, setIsClient] = useState(false)
  
  // Add state for viewing insight
  const [viewingInsight, setViewingInsight] = useState<InsightSummary | null>(null)
  
  // Communication workflow states
  const [step, setStep] = useState<number>(1)
  const [selectedInsights, setSelectedInsights] = useState<string[]>([])
  const [projectInsights, setProjectInsights] = useState<InsightSummary[]>([])
  const [communicationType, setCommunicationType] = useState<CommunicationType | null>(null)
  const [mandatoryPoints, setMandatoryPoints] = useState<string>('')
  const [audience, setAudience] = useState<'all-employees' | 'management' | 'specific-team'>('all-employees')
  const [tone, setTone] = useState<'formal' | 'casual' | 'motivational'>('formal')
  const [additionalContext, setAdditionalContext] = useState<string>('')
  const [generatedCommunication, setGeneratedCommunication] = useState<string | null>(null)
  
  // New state variables for enhanced customization
  const [title, setTitle] = useState<string>('')
  const [style, setStyle] = useState<'narrative' | 'bullet-points' | 'mixed'>('mixed')
  const [detailLevel, setDetailLevel] = useState<number>(50)
  const [formatting, setFormatting] = useState<'paragraphs' | 'bullets' | 'numbered' | 'mixed'>('mixed')
  const [callToAction, setCallToAction] = useState<string>('')
  const [customTerminology, setCustomTerminology] = useState<string>('')
  const [additionalInstructions, setAdditionalInstructions] = useState<string>('')
  
  // State for reference documents
  const [referenceDocuments, setReferenceDocuments] = useState<File[]>([])

  // Add state for highlighted text if it doesn't exist
  const [highlightedTextMap, setHighlightedTextMap] = useState<Record<string, string[]>>({})
  
  // Add selectedInsightsData if it doesn't exist
  const selectedInsightsData = selectedInsights.map(id => {
    return projectInsights.find(insight => insight.id === id) || { id, title: "Unknown Insight" };
  })
  
  // Add the hasHighlightedInsights function if it doesn't exist
  const hasHighlightedInsights = () => {
    return Object.values(highlightedTextMap).some(highlights => highlights.length > 0);
  }
  
  // Add the handleHighlightsChange function if it doesn't exist
  const handleHighlightsChange = (insightId: string, highlights: string[]) => {
    setHighlightedTextMap(prev => ({
      ...prev,
      [insightId]: highlights
    }));
  }

  // Function to handle insight selection/deselection
  const handleInsightSelect = (insightId: string) => {
    // Check if we're unselecting an insight with highlights
    if (selectedInsights.includes(insightId) && highlightedTextMap[insightId]?.length > 0) {
      // Show confirmation dialog
      if (!confirm("This insight has highlighted text. Unselecting it will not include these highlights in your communication. Continue?")) {
        return; // User cancelled the unselection
      }
    }
    
    setSelectedInsights(prev => 
      prev.includes(insightId) 
        ? prev.filter(id => id !== insightId)
        : [...prev, insightId]
    );
  };

  // Function to reset layout issues
  const resetLayout = () => {
    setTimeout(() => {
      // Reset right panel scroll and width
      const rightPanel = document.getElementById('right-panel');
      if (rightPanel) {
        rightPanel.scrollLeft = 0;
        rightPanel.style.width = '75%'; // Updated from 66.67% to 75%
        
        // Reset any overflow issues with insight containers
        const insightContainers = document.querySelectorAll('.insight-container');
        insightContainers.forEach(container => {
          if (container instanceof HTMLElement) {
            container.style.maxWidth = '100%';
            container.style.width = '100%';
            container.style.overflow = 'hidden';
          }
        });
        
        // Reset the main selection container
        const selectionContainer = document.querySelector('.insight-selection-container');
        if (selectionContainer instanceof HTMLElement) {
          selectionContainer.style.maxWidth = '100%';
          selectionContainer.style.width = '100%';
          selectionContainer.style.overflow = 'hidden';
        }
      }
      
      // Reset any dialog content overflow issues
      const dialogContent = document.querySelector('.dialog-content');
      if (dialogContent instanceof HTMLElement) {
        dialogContent.style.overflowX = 'hidden';
        dialogContent.style.wordBreak = 'break-word';
      }
    }, 100);
  };

  // Effect to prevent body scrolling when dialog is open
  useEffect(() => {
    if (viewingInsight) {
      // Prevent body scrolling when dialog is open
      document.body.style.overflow = 'hidden';
    } else {
      // Restore body scrolling when dialog is closed
      document.body.style.overflow = '';
    }
    
    // Cleanup
    return () => {
      document.body.style.overflow = '';
    };
  }, [viewingInsight]);

  // Effect to reset layout when dialog state changes
  useEffect(() => {
    if (!viewingInsight) {
      // Reset layout when dialog closes
      resetLayout();
    }
  }, [viewingInsight]);

  // Effect to reset selected insights when project changes
  useEffect(() => {
    if (selectedProject) {
      // Clear selected insights when project changes
      setSelectedInsights([]);
    }
  }, [selectedProject]);

  // Fetch projects when auth is ready
  useEffect(() => {
    let isMounted = true
    
    const fetchProjects = async () => {
      // Skip if auth isn't ready
      if (!isLoaded) {
        console.log('Auth not loaded yet, waiting...')
        return
      }

      // Skip if not signed in
      if (!isSignedIn) {
        console.log('User not signed in, skipping project fetch')
        setLoading(false)
        return
      }

      try {
        console.log('Auth ready, fetching projects...')
        setLoading(true)

        const response = await fetch('/api/projects')
        
        // Handle response
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error('Project fetch failed:', { 
            status: response.status, 
            statusText: response.statusText,
            errorData 
          })
          throw new Error(errorData.details || 'Failed to fetch projects')
        }

        const data = await response.json()
        console.log('Successfully fetched projects:', data)
        
        if (isMounted) {
          setProjects(data)
          setLoading(false)
        }
      } catch (error) {
        console.error('Error fetching projects:', error)
        if (isMounted) {
          setLoading(false)
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Failed to load projects. Please try refreshing the page.",
            variant: "destructive"
          })
        }
      }
    }

    fetchProjects()

    return () => {
      isMounted = false
    }
  }, [isLoaded, isSignedIn, toast])

  const handleProjectChange = (value: string) => {
    setSelectedProject(value)
    // Reset workflow
    setStep(1)
    setSelectedInsights([])
    setCommunicationType(null)
    setMandatoryPoints('')
    setAdditionalContext('')
    setTitle('')
    setStyle('mixed')
    setDetailLevel(50)
    setFormatting('mixed')
    setCallToAction('')
    setCustomTerminology('')
    setAdditionalInstructions('')
    setReferenceDocuments([])
    // Close any open insight dialog
    setViewingInsight(null)
    
    // First try to fetch real insights from the API
    const fetchInsightsForProject = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/projects/${value}/summaries`)
        
        if (response.ok) {
          const data = await response.json()
          if (data && Array.isArray(data) && data.length > 0) {
            setProjectInsights(data)
            setLoading(false)
            return
          }
        }
        
        // If API call fails or returns empty, fall back to mock data
        provideMockInsights(value)
      } catch (error) {
        console.error('Error fetching insights:', error)
        // Fall back to mock data
        provideMockInsights(value)
      }
    }
    
    // Function to provide mock insights for any project ID
    const provideMockInsights = (projectId: string) => {
      // Create mock insights for the selected project
      const mockInsights: InsightSummary[] = [
        {
          id: `${projectId}-1`,
          title: 'Key Stakeholder Concerns',
          content: 'Stakeholders have expressed concerns about:\n• Timeline feasibility\n• Budget constraints\n• Resource allocation',
          focus_area: 'challenges-barriers' as InsightFocusArea,
          notes: 'Based on interviews with department heads.',
          project_id: projectId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: `${projectId}-2`,
          title: 'Implementation Strategy',
          content: 'Recommended approach:\n• Phased rollout\n• Weekly check-ins\n• Dedicated support team',
          focus_area: 'strategies-solutions' as InsightFocusArea,
          notes: 'Developed with the project management team.',
          project_id: projectId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: `${projectId}-3`,
          title: 'Expected Outcomes',
          content: 'This initiative aims to achieve:\n• 20% increase in efficiency\n• Improved employee satisfaction\n• Standardized processes',
          focus_area: 'outcomes-results' as InsightFocusArea,
          notes: 'Based on similar implementations in other departments.',
          project_id: projectId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      setProjectInsights(mockInsights);
      setLoading(false);
    }
    
    // Start the fetch process
    fetchInsightsForProject();
  }

  const handleViewInsight = (insight: InsightSummary) => {
    // First, ensure the layout is preserved by setting fixed widths
    const rightPanel = document.getElementById('right-panel');
    if (rightPanel) {
      const currentWidth = rightPanel.offsetWidth;
      rightPanel.style.width = `${currentWidth}px`;
    }
    
    // Then set the insight to view
    setViewingInsight(insight);
  }

  const handleNextStep = () => {
    setStep(prev => prev + 1)
  }

  const handlePreviousStep = () => {
    setStep(prev => prev - 1)
  }

  const handleGenerateCommunication = async () => {
    setLoading(true)
    
    // Get the selected insights data
    const insightsData = selectedInsights.map(id => {
      return projectInsights.find(insight => insight.id === id)
    }).filter(Boolean) as InsightSummary[]
    
    // Get the communication type details
    const communicationTypeDetails = communicationTypes.find(type => type.id === communicationType)
    
    if (!communicationTypeDetails) {
      toast({
        title: "Error",
        description: "Please select a communication type.",
        variant: "destructive"
      })
      setLoading(false)
      return
    }
    
    // Prepare the prompt
    const basePrompt = communicationTypeDetails.aiPrompt
    
    // Add insights content with highlighted text prioritized
    const insightsContent = insightsData.map(insight => {
      const highlights = highlightedTextMap[insight.id] || [];
      let highlightedContent = '';
      
      if (highlights.length > 0) {
        highlightedContent = `\nHIGHLIGHTED KEY POINTS:\n${highlights.map(h => `• ${h}`).join('\n')}`;
      }
      
      return `${insight.title}: ${insight.content}${highlightedContent}`;
    }).join('\n\n')
    
    // Prepare highlighted points for the API
    const allHighlightedPoints = Object.entries(highlightedTextMap)
      .filter(([insightId]) => selectedInsights.includes(insightId))
      .flatMap(([_, highlights]) => highlights)
      .map(highlight => `• ${highlight}`)
      .join('\n');
    
    // Add reference documents info
    const referenceDocumentsInfo = referenceDocuments.length > 0 
      ? `REFERENCE DOCUMENTS:\n${referenceDocuments.map(file => file.name).join('\n')}\n\nThe content of these documents has been analyzed and should be used for context and terminology.` 
      : '';
    
    try {
      // Call the DeepSeek API endpoint
      const response = await fetch('/api/communications/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: basePrompt,
          insightsContent,
          highlightedPoints: allHighlightedPoints,
          title,
          audience,
          tone,
          style,
          detailLevel,
          formatting,
          mandatoryPoints,
          callToAction,
          customTerminology,
          additionalContext,
          additionalInstructions,
          referenceDocuments
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate communication');
      }

      const data = await response.json();
      setGeneratedCommunication(data.content);
      setLoading(false);
      setStep(4); // Move to review step
    } catch (error) {
      console.error('Error generating communication:', error);
      toast({
        title: "Error",
        description: "Failed to generate communication. Please try again.",
        variant: "destructive"
      });
      setLoading(false);
    }
  }

  // Get selected project name
  const selectedProjectName = selectedProject 
    ? projects.find(p => p.id === selectedProject)?.title || 'Selected Project'
    : ''

  // Function to navigate to Communications Amigo
  const handleOpenAmigo = () => {
    if (!generatedCommunication) {
      toast({
        title: "Error",
        description: "Please generate a communication first.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Ensure we're on the client side
      if (typeof window === 'undefined') {
        return;
      }
      
      // Prepare the URL parameters in a more compact way
      // Store only essential data to avoid URL length issues
      const communicationData = {
        communication: generatedCommunication,
        title: title || '',
        audience,
        tone,
        style,
        detailLevel,
        formatting,
        mandatoryPoints: mandatoryPoints || '',
        callToAction: callToAction || '',
        customTerminology: customTerminology || '',
        additionalContext: additionalContext || '',
        additionalInstructions: additionalInstructions || '',
        // Include only essential insight data
        insightsContent: selectedInsightsData.map(insight => ({
          id: insight.id,
          title: insight.title,
          content: 'content' in insight ? insight.content : '',
          highlights: highlightedTextMap[insight.id] || []
        })),
        // Get the communication type details
        basePrompt: communicationTypes.find(type => type.id === communicationType)?.aiPrompt || ''
      };
      
      // Store the data in sessionStorage
      sessionStorage.setItem('communicationAmigoData', JSON.stringify(communicationData));
      
      // Add a flag to indicate we're intentionally navigating to Communications Amigo
      sessionStorage.setItem('navigatingToAmigo', 'true');
      
      // Navigate to the root-level communications-amigo page instead of the one under dashboard
      router.push('/communications-amigo');
    } catch (error) {
      console.error('Error opening Communications Amigo:', error);
      toast({
        title: "Error",
        description: "Failed to open Communications Amigo. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Add the handlePopulateTestData function
  const handlePopulateTestData = () => {
    // Set predefined values for customization options
    setTitle("Q3 2023 Organizational Changes");
    setAudience("all-employees");
    setTone("formal");
    setStyle("mixed");
    setDetailLevel(3);
    setFormatting("mixed");
    setMandatoryPoints("Restructuring of the marketing department\nNew leadership appointments\nOffice relocation plans");
    setCallToAction("Please review the changes and attend the town hall meeting on Friday");
    setCustomTerminology("OKRs, KPIs, Agile methodology");
    setAdditionalContext("These changes are part of our 5-year growth strategy");
    setAdditionalInstructions("Include a brief timeline of implementation");
    
    toast({
      title: "Test data populated",
      description: "Customization options have been filled with test data",
    });
  };

  // Check for updated communication from Communications Amigo
  useEffect(() => {
    // Set isClient to true when component mounts on client
    setIsClient(true)
    
    // Only run on client side
    if (typeof window === 'undefined') return
    
    try {
      // Check if we're returning from Communications Amigo
      const returningFromAmigo = sessionStorage.getItem('returningFromAmigo')
      
      if (returningFromAmigo === 'true') {
        console.log('Returning from Communications Amigo, checking for updated communication')
        
        // Get the updated communication
        const updatedCommunication = sessionStorage.getItem('updatedCommunication')
        
        if (updatedCommunication) {
          console.log('Found updated communication, updating state')
          
          // Update the generated communication with the new version
          setGeneratedCommunication(updatedCommunication)
          
          // If we're not already on the review step, go to it
          if (step !== 4) {
            setStep(4)
          }
          
          // Show a toast notification
          toast({
            title: "Communication Updated",
            description: "Your communication has been updated from Communications Amigo.",
          })
        } else {
          console.log('No updated communication found')
        }
        
        // Clear the sessionStorage items
        sessionStorage.removeItem('returningFromAmigo')
        sessionStorage.removeItem('updatedCommunication')
      }
    } catch (error) {
      console.error('Error checking for updated communication:', error)
    }
  }, [isClient, toast, step, setStep, setGeneratedCommunication])

  // Render the appropriate step content
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4 w-full">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h2 className="text-2xl font-bold">Select Insights</h2>
              <Button 
                onClick={handleNextStep} 
                disabled={selectedInsights.length === 0}
                className="flex-shrink-0"
              >
                Next Step
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <p className="text-muted-foreground">
              Choose insights from your project to include in your communication.
              {hasHighlightedInsights() && (
                <span className="ml-1 text-yellow-600 inline-flex items-center">
                  <Highlighter className="h-3.5 w-3.5 mr-1" />
                  Some insights have highlighted key points that will be prioritized.
                </span>
              )}
            </p>
            <InsightSelection 
              insights={projectInsights}
              selectedInsights={selectedInsights}
              onInsightSelect={handleInsightSelect}
              onViewInsight={(insight) => handleViewInsight(insight)}
              loading={loading}
              highlightedTextMap={highlightedTextMap}
            />
          </div>
        )
      
      case 2:
        return (
          <div className="space-y-4 w-full">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h2 className="text-2xl font-bold">Communication Type</h2>
              <div className="space-x-2 flex-shrink-0">
                <Button variant="outline" onClick={handlePreviousStep} size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button 
                  onClick={handleNextStep} 
                  disabled={!communicationType}
                >
                  Next Step
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-muted-foreground">
              Select the type of communication you want to create.
            </p>
            <CommunicationTypeSelection
              selectedType={communicationType}
              onTypeSelect={(type) => setCommunicationType(type)}
            />
          </div>
        )
      
      case 3:
        return (
          <div className="space-y-6 w-full">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Customize Communication</h2>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={handlePreviousStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
              </div>
            </div>
            
            {hasHighlightedInsights() && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 flex items-start gap-2">
                <Highlighter className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-yellow-800 font-medium">Highlighted Key Points</p>
                  <p className="text-xs text-yellow-700 mb-2">
                    You&apos;ve highlighted key points in {Object.keys(highlightedTextMap).filter(id => highlightedTextMap[id].length > 0).length} insight(s). 
                    These points will be prioritized in the generated communication.
                  </p>
                  
                  <details className="text-sm">
                    <summary className="cursor-pointer text-yellow-800 hover:text-yellow-900 font-medium">
                      View all highlighted points
                    </summary>
                    <div className="mt-2 space-y-3 max-h-[300px] overflow-y-auto pr-1" style={{ overflowX: 'hidden' }}>
                      {selectedInsightsData.map(insight => {
                        const highlights = highlightedTextMap[insight.id] || [];
                        if (highlights.length === 0) return null;
                        
                        return (
                          <div key={insight.id} className="border-l-2 border-yellow-300 pl-3 py-1">
                            <p className="font-medium text-sm">{insight.title}</p>
                            <div className="mt-1 space-y-1.5">
                              {highlights.map((highlight, idx) => (
                                <div key={idx} className="bg-yellow-50 p-2 rounded text-sm flex items-start gap-2">
                                  <p className="text-sm break-words flex-1">{highlight}</p>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 text-yellow-700 hover:bg-yellow-100 rounded-full flex-shrink-0"
                                    onClick={() => {
                                      const newHighlights = [...(highlightedTextMap[insight.id] || [])].filter(h => h !== highlight);
                                      handleHighlightsChange(insight.id, newHighlights);
                                    }}
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </details>
                </div>
              </div>
            )}
            
            <CommunicationCustomization
              communicationType={communicationType as CommunicationType}
              title={title}
              setTitle={setTitle}
              audience={audience}
              setAudience={setAudience}
              tone={tone}
              setTone={setTone}
              style={style}
              setStyle={setStyle}
              detailLevel={detailLevel}
              setDetailLevel={setDetailLevel}
              formatting={formatting}
              setFormatting={setFormatting}
              mandatoryPoints={mandatoryPoints}
              setMandatoryPoints={setMandatoryPoints}
              callToAction={callToAction}
              setCallToAction={setCallToAction}
              customTerminology={customTerminology}
              setCustomTerminology={setCustomTerminology}
              additionalContext={additionalContext}
              setAdditionalContext={setAdditionalContext}
              additionalInstructions={additionalInstructions}
              setAdditionalInstructions={setAdditionalInstructions}
              referenceDocuments={referenceDocuments}
              setReferenceDocuments={setReferenceDocuments}
            />
            
            <div className="flex justify-between items-center mt-6">
              <Button 
                variant="secondary" 
                onClick={handlePopulateTestData}
              >
                <Wand2 className="mr-2 h-4 w-4" /> Populate Test Data
              </Button>
              <Button onClick={handleNextStep}>
                Review <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )
      
      case 4:
        return (
          <div className="space-y-6 w-full">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Review Communication</h2>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setStep(3)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Customize
                </Button>
              </div>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Generated Communication</CardTitle>
                <CardDescription>
                  Review your generated communication based on the selected insights and customization options
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2">Generating communication...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-white border rounded-md p-6 whitespace-pre-line">
                      {generatedCommunication}
                    </div>
                    
                    <div className="flex flex-wrap gap-2 justify-end">
                      <Button variant="outline" onClick={() => setStep(3)}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Customize
                      </Button>
                      <Button variant="outline" onClick={handleGenerateCommunication}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Regenerate
                      </Button>
                      <Button variant="secondary" onClick={handleOpenAmigo}>
                        <Maximize2 className="mr-2 h-4 w-4" /> Communications Amigo
                      </Button>
                      <Button>
                        <Send className="mr-2 h-4 w-4" /> Send Communication
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )
      
      default:
        return (
          <div className="text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
            <h3 className="text-xl font-medium mb-2">Communications Assistant</h3>
            <p className="text-muted-foreground mb-6">
              Select a project from the left panel to get started.
              Our AI will help you craft effective communications for your change management initiatives.
            </p>
          </div>
        )
    }
  }

  return (
    <div className="h-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Communications Amigo</h1>
        <p className="text-muted-foreground">
          Create and manage communications for your change management projects
        </p>
      </div>

      <div className="flex h-[calc(100vh-12rem)] overflow-hidden rounded-lg border w-full">
        {/* Left panel - white background */}
        <div className="w-1/4 bg-white p-6 border-r overflow-y-auto flex-shrink-0">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Select a Project</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Choose a project to create communications for
            </p>
            
            {loading ? (
              <div className="flex items-center justify-center h-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : projects.length > 0 ? (
              <Select onValueChange={handleProjectChange} value={selectedProject || undefined}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">No projects available</p>
                <CreateProjectDialog 
                  onProjectCreated={(newProject) => {
                    setProjects(prev => [newProject, ...prev])
                    setSelectedProject(newProject.id)
                  }} 
                />
              </div>
            )}
          </div>

          {selectedProject && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Communication Types</h3>
              <div className="space-y-2">
                <Button 
                  variant={step > 0 ? "default" : "outline"} 
                  className="w-full justify-start"
                  onClick={() => setStep(1)}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  <span>New Communication</span>
                </Button>
                <Button variant="outline" className="w-full justify-start" disabled>
                  <FileText className="mr-2 h-4 w-4" />
                  <span>Saved Templates</span>
                </Button>
                <Button variant="outline" className="w-full justify-start" disabled>
                  <Send className="mr-2 h-4 w-4" />
                  <span>Sent Communications</span>
                </Button>
              </div>
              
              {step > 0 && (
                <div className="pt-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Current Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
                          <p className={`text-xs ${step === 1 ? 'font-medium' : 'text-muted-foreground'}`}>
                            Select Insights
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
                          <p className={`text-xs ${step === 2 ? 'font-medium' : 'text-muted-foreground'}`}>
                            Communication Type
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${step >= 3 ? 'bg-primary' : 'bg-muted'}`} />
                          <p className={`text-xs ${step === 3 ? 'font-medium' : 'text-muted-foreground'}`}>
                            Customize
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${step >= 4 ? 'bg-primary' : 'bg-muted'}`} />
                          <p className={`text-xs ${step === 4 ? 'font-medium' : 'text-muted-foreground'}`}>
                            Review & Generate
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right panel - gray background */}
        <div 
          id="right-panel"
          className="w-3/4 bg-gray-50 p-6 overflow-y-auto overflow-x-hidden flex-shrink-0" 
          style={{ 
            contain: "content",
            width: "75%",
            maxWidth: "75%",
            position: "relative",
            overflowX: "clip"
          }}
        >
          {selectedProject ? (
            renderStepContent()
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md">
                <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                <h3 className="text-xl font-medium mb-2">Communications Assistant</h3>
                <p className="text-muted-foreground mb-6">
                  Select a project from the left panel to get started.
                  Our AI will help you craft effective communications for your change management initiatives.
                </p>
                
                {/* Test button to view an insight */}
                <Button onClick={() => handleViewInsight({
                  id: '1',
                  title: 'Test Insight',
                  content: 'This is a test insight.\nKey Points:\n• Point 1\n• Point 2\n• Point 3',
                  focus_area: 'challenges-barriers' as InsightFocusArea,
                  notes: 'These are some test notes.',
                  project_id: '1',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                })}>
                  View Test Insight
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 
        The Dialog component from shadcn/ui already uses a portal by default,
        which renders the dialog outside the DOM hierarchy of the parent component.
        This prevents layout shifts when the dialog opens/closes.
      */}
      {viewingInsight && (
        <Dialog 
          open={!!viewingInsight} 
          onOpenChange={(open) => {
            if (!open) {
              setViewingInsight(null);
              resetLayout();
            }
          }}
        >
          <DialogContent 
            className="max-w-4xl overflow-hidden dialog-content" 
            style={{ 
              width: "min(calc(100vw - 40px), 56rem)",
              maxWidth: "min(calc(100vw - 40px), 56rem)",
              maxHeight: "90vh",
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 100,
              display: "flex",
              flexDirection: "column"
            }}
          >
            <div className="absolute right-4 top-4 z-10">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 rounded-md"
                onClick={() => {
                  setViewingInsight(null);
                  resetLayout();
                }}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
            
            <div className="w-full overflow-hidden flex flex-col max-h-[90vh]">
              <DialogHeader className="pr-6 flex-shrink-0">
                <div className="flex items-start justify-between gap-4 flex-wrap w-full">
                  <DialogTitle className="break-words mr-4 max-w-full">{viewingInsight.title}</DialogTitle>
                  {viewingInsight.focus_area && (
                    <Badge className={cn("shrink-0", viewingInsight.focus_area && INSIGHT_FOCUS_AREAS[viewingInsight.focus_area as InsightFocusArea]?.color)}>
                      {viewingInsight.focus_area && INSIGHT_FOCUS_AREAS[viewingInsight.focus_area as InsightFocusArea]?.label}
                    </Badge>
                  )}
                </div>
              </DialogHeader>

              <div className="grid gap-4 mt-2 w-full overflow-y-auto pr-1 pb-4 flex-grow" style={{ overflowX: 'hidden' }}>
                {/* Content */}
                <div className="space-y-4 w-full">
                  <h4 className="text-sm font-medium text-foreground border-b pb-1">Summary</h4>
                  <div className="w-full">
                    <HighlightText 
                      text={viewingInsight.content}
                      insightId={viewingInsight.id}
                      onHighlightsChange={handleHighlightsChange}
                      existingHighlights={highlightedTextMap[viewingInsight.id] || []}
                      preserveFormatting={true}
                    />
                  </div>
                </div>
                
                {/* Notes */}
                {viewingInsight.notes && (
                  <div className="space-y-2 w-full">
                    <h4 className="text-sm font-medium text-foreground border-b pb-1">Notes</h4>
                    <div className="w-full">
                      <HighlightText 
                        text={viewingInsight.notes}
                        insightId={`${viewingInsight.id}-notes`}
                        onHighlightsChange={(_, highlights) => {
                          // When notes are highlighted, add them to the main insight's highlights
                          const currentHighlights = highlightedTextMap[viewingInsight.id] || [];
                          handleHighlightsChange(viewingInsight.id, [...currentHighlights, ...highlights]);
                        }}
                        existingHighlights={[]}
                        preserveFormatting={true}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <DialogFooter className="mt-4 pt-3 border-t flex-shrink-0">
                <div className="flex flex-wrap justify-between w-full gap-2">
                  <div>
                    {!selectedInsights.includes(viewingInsight.id) ? (
                      <Button 
                        onClick={() => {
                          handleInsightSelect(viewingInsight.id);
                          toast({
                            title: "Insight added",
                            description: "This insight has been added to your communication.",
                          });
                        }}
                        size="sm"
                      >
                        Add to Communication
                      </Button>
                    ) : (
                      <Button 
                        variant="outline"
                        onClick={() => {
                          handleInsightSelect(viewingInsight.id);
                          toast({
                            title: "Insight removed",
                            description: "This insight has been removed from your communication.",
                          });
                        }}
                        size="sm"
                      >
                        Remove from Communication
                      </Button>
                    )}
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setViewingInsight(null);
                      resetLayout();
                    }}
                  >
                    Close
                  </Button>
                </div>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
} 