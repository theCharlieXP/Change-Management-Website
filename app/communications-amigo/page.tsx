'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft, Save, RefreshCw, Wand2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export default function CommunicationsAmigoPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  // State for the communication
  const [communication, setCommunication] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [previousSettings, setPreviousSettings] = useState<any>({})
  const [isClient, setIsClient] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  
  // State for customization options
  const [title, setTitle] = useState<string>('')
  const [audience, setAudience] = useState<'all-employees' | 'management' | 'specific-team'>('all-employees')
  const [tone, setTone] = useState<'formal' | 'casual' | 'motivational'>('formal')
  const [style, setStyle] = useState<'narrative' | 'bullet-points' | 'mixed'>('mixed')
  const [detailLevel, setDetailLevel] = useState<number>(50)
  const [formatting, setFormatting] = useState<'paragraphs' | 'bullets' | 'numbered' | 'mixed'>('mixed')
  const [mandatoryPoints, setMandatoryPoints] = useState<string>('')
  const [callToAction, setCallToAction] = useState<string>('')
  const [customTerminology, setCustomTerminology] = useState<string>('')
  const [additionalContext, setAdditionalContext] = useState<string>('')
  const [additionalInstructions, setAdditionalInstructions] = useState<string>('')
  
  // State for insight data
  const [insightsContent, setInsightsContent] = useState<string>('')
  const [highlightedPoints, setHighlightedPoints] = useState<string>('')
  const [basePrompt, setBasePrompt] = useState<string>('')
  
  // First useEffect just to set isClient to true
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  // Second useEffect to load data from sessionStorage, only runs on client
  useEffect(() => {
    // Skip if not client-side yet
    if (!isClient) return;
    
    try {
      console.log('Loading data from sessionStorage');
      // Get data from sessionStorage
      const storedData = sessionStorage.getItem('communicationAmigoData');
      
      if (!storedData) {
        // If accessed directly without data, redirect to dashboard
        console.log('No data found in sessionStorage, redirecting to dashboard');
        router.push('/dashboard/communications');
        return;
      }
      
      // Log the data for debugging
      console.log('Data found in sessionStorage, length:', storedData.length);
      
      const data = JSON.parse(storedData);
      console.log('Data parsed successfully');
      
      // Set communication data
      setCommunication(data.communication || '');
      setTitle(data.title || '');
      setAudience(data.audience || 'all-employees');
      setTone(data.tone || 'formal');
      setStyle(data.style || 'mixed');
      setDetailLevel(data.detailLevel || 50);
      setFormatting(data.formatting || 'mixed');
      setMandatoryPoints(data.mandatoryPoints || '');
      setCallToAction(data.callToAction || '');
      setCustomTerminology(data.customTerminology || '');
      setAdditionalContext(data.additionalContext || '');
      setAdditionalInstructions(data.additionalInstructions || '');
      
      // Process insights data
      if (data.insightsContent && Array.isArray(data.insightsContent)) {
        // Format insights content
        const formattedInsights = data.insightsContent.map((insight: any) => {
          let content = `${insight.title}: ${insight.content}`;
          
          if (insight.highlights && insight.highlights.length > 0) {
            content += `\nHIGHLIGHTED KEY POINTS:\n${insight.highlights.map((h: string) => `• ${h}`).join('\n')}`;
          }
          
          return content;
        }).join('\n\n');
        
        setInsightsContent(formattedInsights);
        
        // Format highlighted points
        const allHighlights = data.insightsContent
          .flatMap((insight: any) => insight.highlights || [])
          .map((highlight: string) => `• ${highlight}`)
          .join('\n');
        
        setHighlightedPoints(allHighlights);
      }
      
      setBasePrompt(data.basePrompt || '')
      
      // Store initial settings to track changes
      setPreviousSettings({
        title: data.title || '',
        audience: data.audience || 'all-employees',
        tone: data.tone || 'formal',
        style: data.style || 'mixed',
        detailLevel: data.detailLevel || 50,
        formatting: data.formatting || 'mixed',
        mandatoryPoints: data.mandatoryPoints || '',
        callToAction: data.callToAction || '',
        customTerminology: data.customTerminology || '',
        additionalContext: data.additionalContext || '',
        additionalInstructions: data.additionalInstructions || ''
      });
      
      setDataLoaded(true);
    } catch (error) {
      console.error('Error loading data from sessionStorage:', error);
      // If there's an error, redirect to dashboard
      router.push('/dashboard/communications');
    }
  }, [isClient, router]);
  
  // Function to populate test data
  const handlePopulateTestData = () => {
    // Set test values for all customization options
    setTitle("Change Management Initiative Update");
    setAudience("all-employees");
    setTone("motivational");
    setStyle("mixed");
    setDetailLevel(25); // Brief
    setFormatting("bullets");
    setMandatoryPoints("- New system launch date: June 15th\n- Training sessions will begin next week\n- All employees must complete training by June 1st");
    setCallToAction("Please register for your training session by the end of this week.");
    setCustomTerminology("ProjectNext, ChangeWave, Digital Transformation Initiative");
    setAdditionalContext("This is the third phase of our company-wide digital transformation.");
    setAdditionalInstructions("Include a brief mention of the success of phases 1 and 2.");
    
    toast({
      title: "Test Data Populated",
      description: "Customization options have been filled with test data. Click 'Regenerate Communication' to see the results.",
    });
  };
  
  // Function to identify what settings have changed
  const getChangedSettings = () => {
    const changes = [];
    
    if (title !== previousSettings.title) {
      changes.push(`Changed title from "${previousSettings.title || 'none'}" to "${title || 'none'}"`);
    }
    
    if (audience !== previousSettings.audience) {
      const audienceMap: Record<string, string> = {
        'all-employees': 'All Employees',
        'management': 'Management',
        'specific-team': 'Specific Team'
      };
      changes.push(`Changed audience from "${audienceMap[previousSettings.audience]}" to "${audienceMap[audience]}"`);
    }
    
    if (tone !== previousSettings.tone) {
      const toneMap: Record<string, string> = {
        'formal': 'Formal',
        'casual': 'Casual',
        'motivational': 'Motivational'
      };
      changes.push(`Changed tone from "${toneMap[previousSettings.tone]}" to "${toneMap[tone]}"`);
    }
    
    if (style !== previousSettings.style) {
      const styleMap: Record<string, string> = {
        'narrative': 'Narrative',
        'bullet-points': 'Bullet Points',
        'mixed': 'Mixed'
      };
      changes.push(`Changed style from "${styleMap[previousSettings.style]}" to "${styleMap[style]}"`);
    }
    
    if (detailLevel !== previousSettings.detailLevel) {
      const getDetailLevelText = (level: number) => level < 33 ? 'Brief' : level < 66 ? 'Standard' : 'Detailed';
      changes.push(`Changed detail level from "${getDetailLevelText(previousSettings.detailLevel)}" to "${getDetailLevelText(detailLevel)}"`);
    }
    
    if (formatting !== previousSettings.formatting) {
      const formatMap: Record<string, string> = {
        'paragraphs': 'Paragraphs',
        'bullets': 'Bullet Points',
        'numbered': 'Numbered Lists',
        'mixed': 'Mixed'
      };
      changes.push(`Changed formatting from "${formatMap[previousSettings.formatting]}" to "${formatMap[formatting]}"`);
    }
    
    if (mandatoryPoints !== previousSettings.mandatoryPoints) {
      changes.push("Changed mandatory points");
    }
    
    if (callToAction !== previousSettings.callToAction) {
      changes.push("Changed call to action");
    }
    
    if (customTerminology !== previousSettings.customTerminology) {
      changes.push("Changed custom terminology");
    }
    
    if (additionalContext !== previousSettings.additionalContext) {
      changes.push("Changed additional context");
    }
    
    if (additionalInstructions !== previousSettings.additionalInstructions) {
      changes.push("Changed additional instructions");
    }
    
    return changes;
  };
  
  // Function to regenerate the communication
  const handleRegenerate = async () => {
    setLoading(true);
    
    // Get the changes made to settings
    const changes = getChangedSettings();
    console.log('Changes detected:', changes);
    
    try {
      // First, test if the API is working
      const testResponse = await fetch('/api/communications/test');
      const testData = await testResponse.json();
      console.log('API test response:', testData);
      
      if (!testData.hasDeepSeekApiKey) {
        console.error('DeepSeek API key is not configured');
        toast({
          title: "API Configuration Error",
          description: "The DeepSeek API key is not configured. Please contact the administrator.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }
      
      console.log('Preparing API request payload');
      const payload = {
        prompt: basePrompt,
        insightsContent,
        highlightedPoints,
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
        referenceDocuments: [],
        changedSettings: changes // Pass the changes to the API
      };
      
      console.log('Sending request to API');
      // Call the DeepSeek API endpoint
      const response = await fetch('/api/communications/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('API response status:', response.status);
      
      if (!response.ok) {
        let errorMessage = 'Failed to generate communication';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
          // If we can't parse the JSON, try to get the text
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
        console.error('API error:', errorMessage);
        
        // Use a fallback message if the API call fails
        const fallbackMessage = `
[COMMUNICATION GENERATION FAILED]

We were unable to generate a new communication due to a technical issue.

Error details: ${errorMessage}

Your previous communication is still available. You can try again later or contact support if the issue persists.
`;
        
        setCommunication(fallbackMessage);
        
        toast({
          title: "Error",
          description: "Failed to regenerate communication. Using fallback message.",
          variant: "destructive"
        });
        
        setLoading(false);
        return;
      }

      const data = await response.json();
      console.log('API response received successfully');
      setCommunication(data.content);
      
      // Update previous settings to current settings
      setPreviousSettings({
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
        additionalInstructions
      });
      
      toast({
        title: "Communication Updated",
        description: "Your communication has been regenerated with the new settings.",
      });
    } catch (error) {
      console.error('Error regenerating communication:', error);
      toast({
        title: "Error",
        description: "Failed to regenerate communication. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }
  
  // Function to go back to the communications page
  const handleBack = () => {
    try {
      // Only proceed if we're on the client side
      if (typeof window === 'undefined') return;
      
      // Store the updated communication in sessionStorage for the Communications page to retrieve
      sessionStorage.setItem('updatedCommunication', communication);
      
      // Set a flag to indicate that we're returning from Communications Amigo
      sessionStorage.setItem('returningFromAmigo', 'true');
      
      // Navigate back to the Communications page
      router.push('/dashboard/communications');
    } catch (error) {
      console.error('Error navigating back:', error);
      // If there's an error, just do a simple navigation
      router.push('/dashboard/communications');
    }
  }
  
  // Function to save the communication
  const handleSave = () => {
    // Here you would implement saving the communication to the database
    toast({
      title: "Communication Saved",
      description: "Your communication has been saved successfully.",
    });
  }
  
  // If not client-side yet, render a loading state
  if (!isClient) {
    return null; // Return null on server-side to prevent hydration mismatch
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
    <div className="flex h-screen w-screen bg-gray-50">
      {/* Left sidebar for customization (30% width) */}
      <div className="w-[30%] h-screen overflow-auto border-r p-4 bg-white">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">Communications Amigo</h1>
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-between">
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={handlePopulateTestData}
              className="mb-2"
            >
              <Wand2 className="mr-2 h-4 w-4" /> Populate Test Data
            </Button>
          </div>
          
          <Tabs defaultValue="basic">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="style">Style & Format</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title/Headline</Label>
                <Input 
                  id="title" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="Enter a title for your communication"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="audience">Target Audience</Label>
                <Select 
                  value={audience} 
                  onValueChange={(value: any) => setAudience(value)}
                >
                  <SelectTrigger id="audience">
                    <SelectValue placeholder="Select audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-employees">All Employees</SelectItem>
                    <SelectItem value="management">Management</SelectItem>
                    <SelectItem value="specific-team">Specific Team</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tone">Tone</Label>
                <Select 
                  value={tone} 
                  onValueChange={(value: any) => setTone(value)}
                >
                  <SelectTrigger id="tone">
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="motivational">Motivational</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="mandatoryPoints">Mandatory Points to Include</Label>
                <Textarea 
                  id="mandatoryPoints" 
                  value={mandatoryPoints} 
                  onChange={(e) => setMandatoryPoints(e.target.value)} 
                  placeholder="Enter any points that must be included"
                  rows={3}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="style" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="style">Communication Style</Label>
                <Select 
                  value={style} 
                  onValueChange={(value: any) => setStyle(value)}
                >
                  <SelectTrigger id="style">
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="narrative">Narrative (Paragraphs)</SelectItem>
                    <SelectItem value="bullet-points">Bullet Points</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="formatting">Formatting Preference</Label>
                <Select 
                  value={formatting} 
                  onValueChange={(value: any) => setFormatting(value)}
                >
                  <SelectTrigger id="formatting">
                    <SelectValue placeholder="Select formatting" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paragraphs">Primarily Paragraphs</SelectItem>
                    <SelectItem value="bullets">Primarily Bullet Points</SelectItem>
                    <SelectItem value="numbered">Primarily Numbered Lists</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Detail Level: {detailLevel < 33 ? 'Brief' : detailLevel < 66 ? 'Standard' : 'Detailed'}</Label>
                <Slider 
                  value={[detailLevel]} 
                  onValueChange={(value) => setDetailLevel(value[0])} 
                  min={0} 
                  max={100} 
                  step={1}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="advanced" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="callToAction">Call to Action</Label>
                <Textarea 
                  id="callToAction" 
                  value={callToAction} 
                  onChange={(e) => setCallToAction(e.target.value)} 
                  placeholder="What action should recipients take?"
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="customTerminology">Custom Terminology/Branding</Label>
                <Textarea 
                  id="customTerminology" 
                  value={customTerminology} 
                  onChange={(e) => setCustomTerminology(e.target.value)} 
                  placeholder="Enter any specific terms or branding to use"
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="additionalContext">Additional Context</Label>
                <Textarea 
                  id="additionalContext" 
                  value={additionalContext} 
                  onChange={(e) => setAdditionalContext(e.target.value)} 
                  placeholder="Provide any additional context"
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="additionalInstructions">Additional Instructions</Label>
                <Textarea 
                  id="additionalInstructions" 
                  value={additionalInstructions} 
                  onChange={(e) => setAdditionalInstructions(e.target.value)} 
                  placeholder="Any other specific instructions"
                  rows={2}
                />
              </div>
            </TabsContent>
          </Tabs>
          
          <Button 
            className="w-full" 
            onClick={handleRegenerate} 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Regenerating...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" /> Regenerate Communication
              </>
            )}
          </Button>
          
          <Button 
            className="w-full mt-2" 
            variant="outline" 
            onClick={handleSave}
          >
            <Save className="mr-2 h-4 w-4" /> Save Communication
          </Button>
        </div>
      </div>
      
      {/* Right content area for the communication (70% width) */}
      <div className="w-[70%] h-screen overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>{title || 'Generated Communication'}</CardTitle>
              <CardDescription>
                Your communication will update when you click "Regenerate Communication"
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-white border rounded-md p-6 min-h-[calc(100vh-250px)] whitespace-pre-line">
                {communication}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 