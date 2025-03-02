'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Loader2, MessageSquare, FileText, Send, ArrowLeft, ArrowRight, Maximize2, X } from "lucide-react"
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
import { CommunicationTypeSelection, CommunicationType } from '@/components/communications/communication-type-selection'
import { CommunicationCustomization } from '@/components/communications/communication-customization'
import { ReviewConfirmation } from '@/components/communications/review-confirmation'

export default function CommunicationsPage() {
  const { isLoaded, isSignedIn } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

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

  // Function to reset layout issues
  const resetLayout = () => {
    setTimeout(() => {
      // Reset right panel scroll and width
      const rightPanel = document.getElementById('right-panel');
      if (rightPanel) {
        rightPanel.scrollLeft = 0;
        rightPanel.style.width = '66.67%'; // Reset to original width
        
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

  const handleInsightSelect = (insightId: string) => {
    setSelectedInsights(prev => 
      prev.includes(insightId) 
        ? prev.filter(id => id !== insightId)
        : [...prev, insightId]
    )
  }

  const handleNextStep = () => {
    setStep(prev => prev + 1)
  }

  const handlePreviousStep = () => {
    setStep(prev => prev - 1)
  }

  const handleGenerateCommunication = () => {
    // Mock generation for now
    setGeneratedCommunication("Dear Team,\n\nI'm writing to update you on our ongoing change initiative. We've made significant progress and wanted to share some key information.\n\n[Content would be generated based on selected insights and preferences]\n\nPlease reach out if you have any questions.\n\nBest regards,\nThe Change Management Team")
    setStep(4)
  }

  // Get selected project name
  const selectedProjectName = selectedProject 
    ? projects.find(p => p.id === selectedProject)?.title || 'Selected Project'
    : ''

  // Get selected insights data
  const selectedInsightsData = projectInsights.filter(insight => 
    selectedInsights.includes(insight.id) && insight.project_id === selectedProject
  )

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
            </p>
            <InsightSelection 
              insights={projectInsights}
              selectedInsights={selectedInsights}
              onInsightSelect={handleInsightSelect}
              onViewInsight={handleViewInsight}
              loading={loading}
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
              onTypeSelect={setCommunicationType}
            />
          </div>
        )
      
      case 3:
        return (
          <div className="space-y-4 w-full">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h2 className="text-2xl font-bold">Customize Communication</h2>
              <div className="space-x-2 flex-shrink-0">
                <Button variant="outline" onClick={handlePreviousStep} size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleNextStep}>
                  Review
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-muted-foreground">
              Customize your communication preferences.
            </p>
            <CommunicationCustomization
              communicationType={communicationType as CommunicationType}
              mandatoryPoints={mandatoryPoints}
              setMandatoryPoints={setMandatoryPoints}
              audience={audience}
              setAudience={setAudience}
              tone={tone}
              setTone={setTone}
              additionalContext={additionalContext}
              setAdditionalContext={setAdditionalContext}
            />
          </div>
        )
      
      case 4:
        return generatedCommunication ? (
          <div className="space-y-4 w-full">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h2 className="text-2xl font-bold">Generated Communication</h2>
              <div className="space-x-2 flex-shrink-0">
                <Button variant="outline" onClick={() => setStep(3)} size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Edit
                </Button>
              </div>
            </div>
            <Card className="w-full overflow-hidden">
              <CardHeader>
                <CardTitle>Your {communicationType === 'email' ? 'Email' : communicationType === 'poster' ? 'Poster' : communicationType === 'script' ? 'Script' : 'Announcement'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap bg-muted p-4 rounded-md">
                  {generatedCommunication}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <ReviewConfirmation
            projectName={selectedProjectName}
            selectedInsights={selectedInsightsData}
            communicationType={communicationType as CommunicationType}
            mandatoryPoints={mandatoryPoints}
            audience={audience}
            tone={tone}
            additionalContext={additionalContext}
            onBack={handlePreviousStep}
            onConfirm={handleGenerateCommunication}
          />
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
        <div className="w-1/3 bg-white p-6 border-r overflow-y-auto flex-shrink-0">
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
          className="w-2/3 bg-gray-50 p-6 overflow-y-auto overflow-x-hidden flex-shrink-0" 
          style={{ 
            contain: "content",
            width: "66.67%",
            maxWidth: "66.67%",
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
            className="max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden" 
            style={{ 
              width: "min(calc(100vw - 40px), 56rem)",
              maxWidth: "min(calc(100vw - 40px), 56rem)",
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 100
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
            
            <div className="w-full overflow-hidden">
              <DialogHeader className="pr-6">
                <div className="flex items-start justify-between gap-4 flex-wrap w-full">
                  <DialogTitle className="break-words mr-4 max-w-full">{viewingInsight.title}</DialogTitle>
                  {viewingInsight.focus_area && (
                    <Badge className={cn("shrink-0", viewingInsight.focus_area && INSIGHT_FOCUS_AREAS[viewingInsight.focus_area as InsightFocusArea]?.color)}>
                      {viewingInsight.focus_area && INSIGHT_FOCUS_AREAS[viewingInsight.focus_area as InsightFocusArea]?.label}
                    </Badge>
                  )}
                </div>
              </DialogHeader>

              <div className="grid gap-4 mt-2 w-full">
                {/* Content */}
                <div className="space-y-4 w-full">
                  <h4 className="text-sm font-medium text-foreground border-b pb-1">Summary</h4>
                  <div className="w-full">
                    {viewingInsight.content.split('\n').map((point, index) => {
                      const cleanPoint = point.replace(/^[-•]\s*/, '').trim()
                      if (!cleanPoint) return null
                      
                      // Check if this is likely a heading (ends with a colon or is short)
                      const isHeading = cleanPoint.endsWith(':') || (cleanPoint.length < 30 && !cleanPoint.includes(' and ') && !cleanPoint.includes(','))
                      
                      if (isHeading) {
                        return (
                          <h5 key={index} className="text-sm font-semibold mt-3 text-foreground break-words">
                            {cleanPoint}
                          </h5>
                        )
                      }
                      
                      return (
                        <div key={index} className="flex items-start gap-2 w-full">
                          <span className="text-muted-foreground leading-tight flex-shrink-0">•</span>
                          <p className="text-sm text-foreground flex-1 break-words">
                            {cleanPoint}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {viewingInsight.notes && (
                  <div className="space-y-2 border-t pt-4 w-full">
                    <h4 className="text-sm font-medium text-foreground border-b pb-1">Notes</h4>
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {viewingInsight.notes}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button 
                  onClick={() => {
                    setViewingInsight(null);
                    resetLayout();
                  }}
                  variant="outline"
                  className="flex-shrink-0"
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
} 