import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CommunicationType } from './communication-type-selection'
import { ArrowLeft, Send, Mail, FileText, Presentation, MessageSquare, Newspaper, FileImage, File, Highlighter, X } from 'lucide-react'
import { INSIGHT_FOCUS_AREAS } from '@/types/insights'
import type { InsightSummary } from '@/types/insights'

interface ReviewConfirmationProps {
  projectName: string
  selectedInsights: InsightSummary[]
  communicationType: CommunicationType
  mandatoryPoints: string
  audience: 'all-employees' | 'management' | 'specific-team'
  tone: 'formal' | 'casual' | 'motivational'
  additionalContext: string
  // New props for enhanced customization
  title: string
  style: 'narrative' | 'bullet-points' | 'mixed'
  detailLevel: number
  formatting: 'paragraphs' | 'bullets' | 'numbered' | 'mixed'
  callToAction: string
  customTerminology: string
  additionalInstructions: string
  // Document upload props
  referenceDocuments: File[]
  // New prop for highlighted text
  highlightedTextMap?: Record<string, string[]>
  onBack: () => void
  onConfirm: () => void
}

export function ReviewConfirmation({
  projectName,
  selectedInsights,
  communicationType,
  mandatoryPoints,
  audience,
  tone,
  additionalContext,
  // New props for enhanced customization
  title,
  style,
  detailLevel,
  formatting,
  callToAction,
  customTerminology,
  additionalInstructions,
  // Document upload props
  referenceDocuments,
  // New prop for highlighted text
  highlightedTextMap = {},
  onBack,
  onConfirm
}: ReviewConfirmationProps) {
  // Add state to manage local changes to highlighted text
  const [localHighlightedTextMap, setLocalHighlightedTextMap] = useState(highlightedTextMap);

  // Map audience and tone to display values
  const audienceDisplay = {
    'all-employees': 'All Employees',
    'management': 'Management',
    'specific-team': 'Specific Team/Department'
  }

  const toneDisplay = {
    'formal': 'Formal and Professional',
    'casual': 'Friendly and Engaging',
    'motivational': 'Concise and Direct'
  }

  // Map communication type to display values
  const communicationTypeDisplay = {
    'email-announcement': 'Email Announcement',
    'stakeholder-memo': 'Stakeholder Update Memo',
    'presentation-script': 'Town Hall Presentation Script',
    'faq-document': 'FAQ Document',
    'newsletter-article': 'Internal Newsletter Article',
    'poster': 'Poster/Flyer'
  }

  // Map style and formatting to display values
  const styleDisplay = {
    'narrative': 'Narrative (flowing paragraphs)',
    'bullet-points': 'Bullet Points (concise lists)',
    'mixed': 'Mixed (combination of both)'
  }

  const formattingDisplay = {
    'paragraphs': 'Primarily Paragraphs',
    'bullets': 'Primarily Bullet Points',
    'numbered': 'Primarily Numbered Lists',
    'mixed': 'Mixed Format'
  }

  // Get detail level display
  const getDetailLevelDisplay = () => {
    if (detailLevel < 33) return 'Brief Overview';
    if (detailLevel < 66) return 'Standard Detail';
    return 'In-Depth Explanation';
  }

  // Get file icon based on file extension
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (extension === 'pdf') {
      return <FileText className="h-4 w-4 text-red-500" />;
    } else if (['doc', 'docx', 'rtf', 'txt'].includes(extension || '')) {
      return <FileText className="h-4 w-4 text-blue-500" />;
    } else if (['ppt', 'pptx'].includes(extension || '')) {
      return <FileText className="h-4 w-4 text-orange-500" />;
    } else if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) {
      return <FileImage className="h-4 w-4 text-green-500" />;
    } else {
      return <File className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-3 w-full" style={{ maxWidth: "100%" }}>
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-xl font-bold">Review & Generate</h2>
        <div className="space-x-2 flex-shrink-0">
          <Button variant="outline" onClick={onBack} size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={onConfirm} size="sm">
            <Send className="mr-2 h-4 w-4" />
            Generate
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
        <Card className="w-full overflow-hidden">
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-sm">Project</CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-3">
            <p className="text-sm break-words">{projectName}</p>
          </CardContent>
        </Card>
        
        <Card className="w-full overflow-hidden">
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-sm">Communication Type</CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-3">
            <div className="flex items-center gap-2">
              <div className="flex-shrink-0">
                {communicationType === 'email-announcement' && <Mail className="h-4 w-4" />}
                {communicationType === 'stakeholder-memo' && <FileText className="h-4 w-4" />}
                {communicationType === 'presentation-script' && <Presentation className="h-4 w-4" />}
                {communicationType === 'faq-document' && <MessageSquare className="h-4 w-4" />}
                {communicationType === 'newsletter-article' && <Newspaper className="h-4 w-4" />}
                {communicationType === 'poster' && <FileImage className="h-4 w-4" />}
              </div>
              <p className="text-sm break-words">
                {communicationTypeDisplay[communicationType] || 'Communication'}
              </p>
            </div>
          </CardContent>
        </Card>

        {title && (
          <Card className="w-full overflow-hidden">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-sm">
                {communicationType === 'email-announcement' ? 'Subject Line' : 'Title/Headline'}
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-3">
              <p className="text-sm break-words">{title}</p>
            </CardContent>
          </Card>
        )}
      </div>
      
      <Card className="w-full overflow-hidden">
        <CardHeader className="py-2 px-3">
          <CardTitle className="text-sm">Selected Insights ({selectedInsights.length})</CardTitle>
        </CardHeader>
        <CardContent className="py-2 px-3">
          <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-2 overflow-x-hidden">
            {selectedInsights.map((insight) => {
              const highlights = localHighlightedTextMap[insight.id] || [];
              return (
                <div key={insight.id} className="flex items-start gap-2 border-b pb-1.5 last:border-0 last:pb-0">
                  <div className="h-2 w-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <div className="min-w-0 w-full">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium truncate">{insight.title}</p>
                      {highlights.length > 0 && (
                        <Badge variant="outline" className="flex items-center gap-1 bg-yellow-50 text-yellow-800 border-yellow-200">
                          <Highlighter className="h-3 w-3" />
                          <span className="text-xs">{highlights.length}</span>
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 break-words">{insight.content}</p>
                    
                    {highlights.length > 0 && (
                      <div className="mt-1">
                        <details className="text-xs">
                          <summary className="cursor-pointer text-yellow-800 hover:text-yellow-900 font-medium">
                            View highlighted points
                          </summary>
                          <div className="pl-2 border-l-2 border-yellow-200 mt-1 space-y-1 max-h-[150px] overflow-y-auto pr-1" style={{ overflowX: 'hidden' }}>
                            {highlights.map((highlight, idx) => (
                              <div key={idx} className="flex items-start gap-1.5 bg-yellow-50 px-1.5 py-1 rounded">
                                <p className="text-xs break-words flex-1">{highlight}</p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 w-5 p-0 text-yellow-700 hover:bg-yellow-100 rounded-full flex-shrink-0"
                                  onClick={() => {
                                    // Create a new map without this highlight
                                    const newHighlightMap = {...localHighlightedTextMap};
                                    newHighlightMap[insight.id] = (newHighlightMap[insight.id] || []).filter(h => h !== highlight);
                                    
                                    // Update the parent component's state
                                    // This is just for UI display in the review step
                                    // The actual state is managed in the parent component
                                    const updatedHighlights = {...localHighlightedTextMap};
                                    updatedHighlights[insight.id] = (updatedHighlights[insight.id] || []).filter(h => h !== highlight);
                                    
                                    // Force a re-render
                                    setLocalHighlightedTextMap(updatedHighlights);
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 w-full">
        <Card className="w-full overflow-hidden">
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-sm">Audience & Tone</CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-3 space-y-1.5">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Audience</p>
              <p className="text-sm break-words">{audienceDisplay[audience]}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Tone</p>
              <p className="text-sm break-words">{toneDisplay[tone]}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="w-full overflow-hidden">
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-sm">Style & Format</CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-3 space-y-1.5">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Style</p>
              <p className="text-sm break-words">{styleDisplay[style]}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Formatting</p>
              <p className="text-sm break-words">{formattingDisplay[formatting]}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Detail Level</p>
              <p className="text-sm break-words">{getDetailLevelDisplay()}</p>
            </div>
          </CardContent>
        </Card>

        {(mandatoryPoints || callToAction) && (
          <Card className="w-full overflow-hidden">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-sm">Key Content</CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-3 space-y-1.5">
              {mandatoryPoints && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Key Points</p>
                  <p className="text-sm break-words line-clamp-3">{mandatoryPoints}</p>
                </div>
              )}
              {callToAction && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Call to Action</p>
                  <p className="text-sm break-words line-clamp-2">{callToAction}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Reference Documents */}
      {referenceDocuments.length > 0 && (
        <Card className="w-full overflow-hidden">
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-sm">Reference Documents ({referenceDocuments.length})</CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-3">
            <div className="space-y-1.5">
              {referenceDocuments.map((file, index) => (
                <div key={index} className="flex items-center gap-2">
                  {getFileIcon(file.name)}
                  <p className="text-sm truncate">{file.name}</p>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {(file.size / 1024).toFixed(0)} KB
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {(additionalContext || customTerminology || additionalInstructions) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
          {additionalContext && (
            <Card className="w-full overflow-hidden">
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-sm">Context & Background</CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-3">
                <p className="text-sm break-words line-clamp-4">{additionalContext}</p>
              </CardContent>
            </Card>
          )}
          
          {customTerminology && (
            <Card className="w-full overflow-hidden">
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-sm">Custom Terminology</CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-3">
                <p className="text-sm break-words line-clamp-4">{customTerminology}</p>
              </CardContent>
            </Card>
          )}

          {additionalInstructions && (
            <Card className="w-full overflow-hidden">
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-sm">Additional Instructions</CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-3">
                <p className="text-sm break-words line-clamp-4">{additionalInstructions}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
} 