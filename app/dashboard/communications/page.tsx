'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Loader2, MessageSquare, FileText, Send, ArrowLeft, ArrowRight, Maximize2, X, Highlighter, RefreshCw, Wand2, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from '@clerk/nextjs'
import type { Project } from '@/types/projects'
import type { InsightSummary } from '@/types/insights'
import { CreateProjectDialog } from '@/components/projects/create-project-dialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
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
import { format } from 'date-fns'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

// Import the communicationTypes array
import { communicationTypes } from '@/components/communications/communication-type-selection'

// Define the SavedCommunication interface
interface SavedCommunication {
  id: string
  title: string
  content: string
  communication_type: string | null
  created_at: string
  updated_at: string
}

export default function CommunicationsPage() {
  const { isLoaded, isSignedIn } = useAuth()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [projectsLoading, setProjectsLoading] = useState(true)
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
  
  // Add separate loading state for communication generation
  const [generatingCommunication, setGeneratingCommunication] = useState(false)
  
  // Add state for saved communications pagination
  const [savedCommunicationsPage, setSavedCommunicationsPage] = useState(1)
  const COMMUNICATIONS_PER_PAGE = 5
  
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
    }else {
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

  // Fetch projects when component mounts
  useEffect(() => {
    if (!isSignedIn) return;
    
    const fetchProjects = async () => {
      setProjectsLoading(true);
      try {
        const response = await fetch('/api/projects');
        
        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }
        
        const data = await response.json();
        setProjects(data);
      } catch (error) {
        console.error('Error fetching projects:', error);
        toast({
          title: "Error",
          description: "Failed to load projects. Please try again.",
          variant: "destructive"
        });
      } finally {
        setProjectsLoading(false);
      }
    };
    
    fetchProjects();
  }, [isSignedIn, toast]);

  const handleProjectChange = (value: string) => {
    setSelectedProject(value);
    resetPagination();
    // Reset workflow
    setStep(1);
    setSelectedInsights([]);
    setCommunicationType(null);
    setMandatoryPoints('');
    setAdditionalContext('');
    setTitle('');
    setStyle('mixed');
    setDetailLevel(50);
    setFormatting('mixed');
    setCallToAction('');
    setCustomTerminology('');
    setAdditionalInstructions('');
    setReferenceDocuments([]);
    // Close any open insight dialog
    setViewingInsight(null);
    
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
      }catch (error) {
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
          updated_at: new Date().toISOString(),
          query: 'stakeholder concerns change management',
          industries: ['Healthcare', 'Technology & IT']
        },
        {
          id: `${projectId}-2`,
          title: 'Implementation Strategy',
          content: 'Recommended approach:\n• Phased rollout\n• Weekly check-ins\n• Dedicated support team',
          focus_area: 'strategies-solutions' as InsightFocusArea,
          notes: 'Developed with the project management team.',
          project_id: projectId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          query: 'implementation strategy phased rollout',
          industries: ['Finance & Banking', 'Manufacturing']
        },
        {
          id: `${projectId}-3`,
          title: 'Expected Outcomes',
          content: 'This initiative aims to achieve:\n• 20% increase in efficiency\n• Improved employee satisfaction\n• Standardized processes',
          focus_area: 'outcomes-results' as InsightFocusArea,
          notes: 'Based on similar implementations in other departments.',
          project_id: projectId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          query: 'change management outcomes efficiency',
          industries: ['Government & Public Sector', 'Education']
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
    // Simply decrement the step without resetting any state
    setStep(prev => prev - 1)
  }

  const handleGenerateCommunication = async () => {
    setLoading(true)
    
    // Move to step 4 immediately to show the loading screen
    setStep(4)
    
    // Get the selected insights data
    const insightsData = selectedInsights.map(id => {
      return projectInsights.find(insight => insight.id === id)
    }).filter(Boolean) as InsightSummary[]
    
    // Get the communication type details and label
    const communicationTypeDetails = communicationTypes.find(type => type.id === communicationType)
    const communicationTypeLabel = communicationTypeDetails?.label || 'Unknown Type'
    
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
    
    // Add insights content with highlighted text prioritised
    const insightsContent = insightsData.map(insight => {
      const highlights = highlightedTextMap[insight.id] || [];
      let highlightedContent = '';
      
      if (highlights.length > 0) {
        highlightedContent = `\nHIGHLIGHTED KEY POINTS:\n${highlights.map(h => `• ${h}`).join('\n')}`;
      }
      
      return `${insight.title}: ${insight.content}${highlightedContent}`;
    }).join('\n\n')
    
    // Add customization options
    const customizationOptions = `
COMMUNICATION DETAILS:
- Type: ${communicationTypeLabel}
- Title/Subject: ${title || 'Not specified'}
- Target Audience: ${audience === 'all-employees' ? 'All Employees' : audience === 'management' ? 'Management Team' : 'Specific Team/Department'}
- Tone: ${tone === 'formal' ? 'Formal and Professional' : tone === 'casual' ? 'Friendly and Engaging' : 'Concise and Direct'}
- Style: ${style === 'narrative' ? 'Narrative (flowing paragraphs)' : style === 'bullet-points' ? 'Bullet Points (concise lists)' : 'Mixed (combination of both)'}
- Detail Level: ${detailLevel < 33 ? 'Brief' : detailLevel < 66 ? 'Standard' : 'Detailed'}
- Formatting: ${formatting === 'paragraphs' ? 'Primarily Paragraphs' : formatting === 'bullets' ? 'Primarily Bullet Points' : formatting === 'numbered' ? 'Primarily Numbered Lists' : 'Mixed Format'}

CONTENT REQUIREMENTS:
${mandatoryPoints ? `- Key Points: ${mandatoryPoints}` : ''}
${callToAction ? `- Call to Action: ${callToAction}` : ''}
${additionalContext ? `- Context/Background: ${additionalContext}` : ''}
${customTerminology ? `- Custom Terminology: ${customTerminology}` : ''}
${additionalInstructions ? `- Additional Instructions: ${additionalInstructions}` : ''}
`
    
    // Combine everything into the final prompt
    const finalPrompt = `${basePrompt}\n\nINSIGHTS TO INCLUDE:\n${insightsContent}\n\n${customizationOptions}`
    
    try {
      // Use the existing API endpoint
      const response = await fetch('/api/communications/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: finalPrompt,
          communicationType: communicationType,
          title: title,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate communication')
      }
      
      const data = await response.json()
      setGeneratedCommunication(data.content)
      
      // Move directly to the generated communication view
      setStep(4)
    } catch (error) {
      console.error('Error generating communication:', error)
      toast({
        title: "Error",
        description: "Failed to generate communication. Please try again.",
        variant: "destructive"
      })
      
      // Set some mock content for testing
      setGeneratedCommunication(`# ${title || 'Change Management Communication'}\n\nDear Team,\n\nWe are excited to announce the upcoming changes to our project management system. These changes are designed to improve efficiency and collaboration across all departments.\n\n## Key Changes\n\n- New dashboard interface for better visibility\n- Streamlined approval process\n- Enhanced reporting capabilities\n\n## Timeline\n\nThe changes will be rolled out in phases starting next month. Training sessions will be scheduled for all team members.\n\n## Next Steps\n\nPlease review the attached documentation and reach out to your department lead with any questions.\n\nBest regards,\nThe Change Management Team`)
      
      // Move directly to the generated communication view
      setStep(4)
    } finally {
      setLoading(false)
    }
  }

  // Get selected project name
  const selectedProjectName = selectedProject 
    ? projects.find(p => p.id === selectedProject)?.title || 'Selected Project'
    : ''

  // Function to navigate to Communications Amigo
  const handleOpenAmigo = () => {
    try {
      // Ensure we're on the client side
      if (typeof window === 'undefined') {
        return;
      }
      
      // Prepare the data for Amigo
      const communicationData = {
        communication: generatedCommunication,
        title: title,
        projectId: selectedProject,
        communicationType: communicationType,
        // Add all customization options
        selectedInsights: selectedInsights,
        audience: audience,
        tone: tone,
        style: style,
        detailLevel: detailLevel,
        formatting: formatting,
        mandatoryPoints: mandatoryPoints,
        callToAction: callToAction,
        customTerminology: customTerminology,
        additionalContext: additionalContext,
        additionalInstructions: additionalInstructions,
        highlightedTextMap: highlightedTextMap
      };
      
      // Store the data in sessionStorage
      sessionStorage.setItem('communicationAmigoData', JSON.stringify(communicationData));
      
      // Add a flag to indicate we're intentionally navigating to Communications Amigo
      sessionStorage.setItem('navigatingToAmigo', 'true');
      
      // Navigate to the communications-amigo page
      router.push('/communications-amigo');
    } catch (error) {
      console.error('Error navigating to Amigo:', error);
      toast({
        title: "Error",
        description: "Failed to open Communications Amigo. Please try again.",
        variant: "destructive"
      });
    }
  }

  // Function to populate test data
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
        
        // Restore the selected project
        const savedProjectId = sessionStorage.getItem('selectedProjectId')
        if (savedProjectId) {
          console.log('Restoring selected project:', savedProjectId)
          setSelectedProject(savedProjectId)
        }
        
        // Restore the communication type
        const savedCommunicationType = sessionStorage.getItem('selectedCommunicationType')
        if (savedCommunicationType) {
          console.log('Restoring communication type:', savedCommunicationType)
          setCommunicationType(savedCommunicationType as CommunicationType)
        }
        
        // Restore the communication title
        const savedTitle = sessionStorage.getItem('communicationTitle')
        if (savedTitle) {
          console.log('Restoring communication title:', savedTitle)
          setTitle(savedTitle)
        }
        
        // Check if we should preserve all customization options
        const preserveCustomization = sessionStorage.getItem('preserveCustomizationOptions')
        
        if (preserveCustomization === 'true') {
          console.log('Preserving all customization options')
          
          // Get the original data that was passed to Amigo
          const amigoDataString = sessionStorage.getItem('communicationAmigoData')
          if (amigoDataString) {
            try {
              const amigoData = JSON.parse(amigoDataString)
              
              // Restore selected insights if they exist in the data
              if (amigoData.selectedInsights) {
                setSelectedInsights(amigoData.selectedInsights)
              }
              
              // Restore customization options if they exist
              if (amigoData.audience) setAudience(amigoData.audience)
              if (amigoData.tone) setTone(amigoData.tone)
              if (amigoData.style) setStyle(amigoData.style)
              if (amigoData.detailLevel) setDetailLevel(amigoData.detailLevel)
              if (amigoData.formatting) setFormatting(amigoData.formatting)
              if (amigoData.mandatoryPoints) setMandatoryPoints(amigoData.mandatoryPoints)
              if (amigoData.callToAction) setCallToAction(amigoData.callToAction)
              if (amigoData.customTerminology) setCustomTerminology(amigoData.customTerminology)
              if (amigoData.additionalContext) setAdditionalContext(amigoData.additionalContext)
              if (amigoData.additionalInstructions) setAdditionalInstructions(amigoData.additionalInstructions)
              if (amigoData.highlightedTextMap) setHighlightedTextMap(amigoData.highlightedTextMap)
            } catch (parseError) {
              console.error('Error parsing Amigo data:', parseError)
            }
          }
        }
        
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
        sessionStorage.removeItem('selectedProjectId')
        sessionStorage.removeItem('selectedCommunicationType')
        sessionStorage.removeItem('communicationTitle')
        sessionStorage.removeItem('preserveCustomizationOptions')
      }
    } catch (error) {
      console.error('Error checking for updated communication:', error)
    }
  }, [isClient, toast, step, setStep, setGeneratedCommunication])

  // Add state for saved communications
  const [savedCommunications, setSavedCommunications] = useState<SavedCommunication[]>([])
  const [loadingSaved, setLoadingSaved] = useState(false)
  const [selectedSavedCommunication, setSelectedSavedCommunication] = useState<SavedCommunication | null>(null)
  
  // Add state for delete confirmation
  const [communicationToDelete, setCommunicationToDelete] = useState<SavedCommunication | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Add useEffect to fetch saved communications when a project is selected
  useEffect(() => {
    if (!selectedProject || !isSignedIn) return;
    
    const fetchSavedCommunications = async () => {
      setLoadingSaved(true);
      try {
        const response = await fetch(`/api/communications/save?projectId=${selectedProject}`);
        
        if (!response.ok) {
          // Try to get the error message from the response
          let errorMessage = 'Failed to fetch saved communications';
          try {
            const errorData = await response.json();
            if (errorData.message) {
              errorMessage = errorData.message;
            }
          } catch (parseError) {
            // If we can't parse the JSON, just use the default error message
            console.error('Error parsing error response:', parseError);
          }
          
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        // Sort communications by updated_at date, most recent first
        const sortedData = data.sort((a: SavedCommunication, b: SavedCommunication) => 
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
        setSavedCommunications(sortedData);
      } catch (error) {
        console.error('Error fetching saved communications:', error);
        
        // Check if the error is related to the table not existing
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const isTableNotExistError = errorMessage.includes('table not ready') || 
                                    errorMessage.includes('does not exist');
        
        if (isTableNotExistError) {
          // If the table doesn't exist, just set an empty array and don't show an error
          console.log('Table does not exist yet, setting empty saved communications');
          setSavedCommunications([]);
        } else {
          // For other errors, show a toast
          toast({
            title: "Error",
            description: "Failed to load saved communications.",
            variant: "destructive"
          });
        }
      } finally {
        setLoadingSaved(false);
      }
    };
    
    fetchSavedCommunications();
  }, [selectedProject, isSignedIn, toast]);
  
  // Function to view a saved communication
  const handleViewSavedCommunication = (communication: SavedCommunication) => {
    setSelectedSavedCommunication(communication);
  }
  
  // Function to edit a saved communication with Amigo
  const handleEditWithAmigo = (communication: SavedCommunication) => {
    try {
      // Ensure we're on the client side
      if (typeof window === 'undefined') {
        return;
      }
      
      // Get the communication type details
      const communicationTypeDetails = communicationTypes.find(
        type => type.id === communication.communication_type
      );
      
      // Prepare the data for Amigo
      const communicationData = {
        communication: communication.content,
        title: communication.title,
        projectId: selectedProject,
        communicationType: communication.communication_type,
        // Include current customization options if available
        selectedInsights: selectedInsights,
        audience: audience,
        tone: tone,
        style: style,
        detailLevel: detailLevel,
        formatting: formatting,
        mandatoryPoints: mandatoryPoints,
        callToAction: callToAction,
        customTerminology: customTerminology,
        additionalContext: additionalContext,
        additionalInstructions: additionalInstructions,
        highlightedTextMap: highlightedTextMap
      };
      
      // Store the data in sessionStorage
      sessionStorage.setItem('communicationAmigoData', JSON.stringify(communicationData));
      
      // Add a flag to indicate we're intentionally navigating to Communications Amigo
      sessionStorage.setItem('navigatingToAmigo', 'true');
      
      // Navigate to the communications-amigo page
      router.push('/communications-amigo');
    } catch (error) {
      console.error('Error navigating to Amigo:', error);
      toast({
        title: "Error",
        description: "Failed to open Communications Amigo. Please try again.",
        variant: "destructive"
      });
    }
  }

  // Function to handle deleting a saved communication
  const handleDeleteCommunication = async (communication: SavedCommunication) => {
    setCommunicationToDelete(communication);
  }
  
  // Function to confirm deletion
  const confirmDelete = async () => {
    if (!communicationToDelete) return;
    
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/communications/delete?id=${communicationToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete communication');
      }
      
      // Remove the deleted communication from the state
      setSavedCommunications(prev => 
        prev.filter(comm => comm.id !== communicationToDelete.id)
      );
      
      // If the deleted communication was being viewed, clear it
      if (selectedSavedCommunication?.id === communicationToDelete.id) {
        setSelectedSavedCommunication(null);
      }
      
      toast({
        title: "Success",
        description: "Communication deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting communication:', error);
      toast({
        title: "Error",
        description: "Failed to delete communication. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setCommunicationToDelete(null);
    }
  }

  // Function to get paginated saved communications
  const getPaginatedSavedCommunications = () => {
    const startIndex = (savedCommunicationsPage - 1) * COMMUNICATIONS_PER_PAGE;
    const endIndex = startIndex + COMMUNICATIONS_PER_PAGE;
    return savedCommunications.slice(startIndex, endIndex);
  }
  
  // Function to handle loading more saved communications
  const handleLoadMoreCommunications = () => {
    setSavedCommunicationsPage(prev => prev + 1);
  }
  
  // Function to reset pagination when changing projects
  const resetPagination = () => {
    setSavedCommunicationsPage(1);
  }

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
              Select content to include in your communication.
              {hasHighlightedInsights() && (
                <span className="ml-1 text-yellow-600 inline-flex items-center">
                  <Highlighter className="h-3.5 w-3.5 mr-1" />
                  Some insights have highlighted key points that will be prioritised.
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
                <Button variant="outline" onClick={handlePreviousStep}size="sm">
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
        // Get the communication type label for display
        const selectedTypeLabel = communicationTypes.find(type => type.id === communicationType)?.label || 'Unknown Type'
        
        return (
          <div className="space-y-6 w-full">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Customise Communication ({selectedTypeLabel})</h2>
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
                    These points will be prioritised in the generated communication.
                  </p>
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
              <Button 
                onClick={handleGenerateCommunication}
                disabled={generatingCommunication}
              >
                {generatingCommunication ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    Generate Communication <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )
      
      case 4:
        return (
          <div className="space-y-6 w-full">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-6">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
                <div className="text-center">
                  <h3 className="text-xl font-medium mb-2">Generating Your Communication</h3>
                  <p className="text-muted-foreground">
                    Please wait while we craft your communication based on the selected insights and customisation options.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Generated Communication</h2>
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={() => setStep(3)}>
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back to Customise
                    </Button>
                  </div>
                </div>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      <div className="bg-white border rounded-md p-6 whitespace-pre-line">
                        {generatedCommunication}
                      </div>
                      
                      <div className="flex flex-wrap gap-2 justify-end">
                        <Button variant="outline" onClick={() => setStep(3)}>
                          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Customise
                        </Button>
                        <Button 
                          onClick={handleOpenAmigo}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <Wand2 className="mr-2 h-4 w-4" /> Edit with Amigo
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )
      
      default:
        return (
          <div className="text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
            <h3 className="text-xl font-medium mb-2">Communications</h3>
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
        <h1 className="text-3xl font-bold tracking-tight">Communications</h1>
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
            
            {projectsLoading ? (
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
              <h3 className="text-lg font-medium">Communications</h3>
              
              <div className="space-y-2 mt-2">
                {loadingSaved ? (
                  <div className="flex items-center justify-center h-20">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : savedCommunications.length > 0 ? (
                  <div className="space-y-2">
                    {getPaginatedSavedCommunications().map((comm) => {
                      // Find the communication type details
                      const typeDetails = communicationTypes.find(
                        type => type.id === comm.communication_type
                      );
                      
                      return (
                        <Button 
                          key={comm.id}
                          variant="outline" 
                          className="w-full justify-start text-left"
                          onClick={() => handleViewSavedCommunication(comm)}
                        >
                          <FileText className="mr-2 h-4 w-4 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="block truncate font-medium">{comm.title}</span>
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{typeDetails?.label || 'Unknown type'}</span>
                              <span>{format(new Date(comm.updated_at), 'MMM d, yyyy')}</span>
                            </div>
                          </div>
                        </Button>
                      );
                    })}
                    
                    {savedCommunications.length > COMMUNICATIONS_PER_PAGE * savedCommunicationsPage && (
                      <Button 
                        variant="ghost" 
                        className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
                        onClick={handleLoadMoreCommunications}
                      >
                        Show More ({savedCommunications.length - COMMUNICATIONS_PER_PAGE * savedCommunicationsPage} remaining)
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground mb-2">No saved communications</p>
                    <p className="text-xs text-muted-foreground">
                      Create a communication and finalise it to save it here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right panel - gray background */}
        <div className="flex-1 bg-gray-50 p-6 overflow-y-auto" id="right-panel">
          {/* If we're viewing a saved communication */}
          {selectedSavedCommunication ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">{selectedSavedCommunication.title}</h2>
                <div className="space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedSavedCommunication(null)}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => handleEditWithAmigo(selectedSavedCommunication)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Wand2 className="mr-2 h-4 w-4" />
                    Edit with Amigo
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="text-red-500 hover:text-red-700 border-red-200 hover:bg-red-50"
                    onClick={() => handleDeleteCommunication(selectedSavedCommunication)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Saved Communication</CardTitle>
                  <CardDescription>
                    Created on {format(new Date(selectedSavedCommunication.created_at), 'MMMM d, yyyy')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-white border rounded-md p-6 whitespace-pre-line">
                    {selectedSavedCommunication.content}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            // Otherwise show the regular step content
            renderStepContent()
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

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!communicationToDelete} onOpenChange={(open: boolean) => !open && setCommunicationToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Communication</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{communicationToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>Delete</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}