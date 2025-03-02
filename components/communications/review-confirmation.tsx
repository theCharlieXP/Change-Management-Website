import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CommunicationType } from './communication-type-selection'
import { ArrowLeft, Send, Mail, FileText, Presentation, Megaphone } from 'lucide-react'
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
  onBack,
  onConfirm
}: ReviewConfirmationProps) {
  // Map audience and tone to display values
  const audienceDisplay = {
    'all-employees': 'All Employees',
    'management': 'Management',
    'specific-team': 'Specific Team/Department'
  }

  const toneDisplay = {
    'formal': 'Formal',
    'casual': 'Casual',
    'motivational': 'Motivational'
  }

  // Map communication type to display values
  const communicationTypeDisplay = {
    'email': 'Email',
    'poster': 'Poster',
    'script': 'Script',
    'other': 'Announcement'
  }

  return (
    <div className="space-y-4 w-full" style={{ maxWidth: "100%" }}>
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-2xl font-bold">Review & Generate</h2>
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
      
      <p className="text-muted-foreground text-sm mb-4">
        Review your selections before generating the communication.
      </p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full" style={{ maxWidth: "100%" }}>
        <Card className="w-full overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Project</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm break-words">{projectName}</p>
          </CardContent>
        </Card>
        
        <Card className="w-full overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Communication Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="flex-shrink-0">
                {communicationType === 'email' && <Mail className="h-4 w-4" />}
                {communicationType === 'poster' && <FileText className="h-4 w-4" />}
                {communicationType === 'script' && <Presentation className="h-4 w-4" />}
                {communicationType === 'other' && <Megaphone className="h-4 w-4" />}
              </div>
              <p className="text-sm break-words">
                {communicationType === 'email' && 'Email Communication'}
                {communicationType === 'poster' && 'Poster/Flyer'}
                {communicationType === 'script' && 'Presentation Script'}
                {communicationType === 'other' && 'Announcement'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="w-full overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Selected Insights ({selectedInsights.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 overflow-x-hidden">
            {selectedInsights.map((insight) => (
              <div key={insight.id} className="flex items-start gap-2 border-b pb-2 last:border-0">
                <div className="h-2 w-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <div className="min-w-0 w-full">
                  <p className="text-sm font-medium truncate">{insight.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1 break-words">{insight.content}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full" style={{ maxWidth: "100%" }}>
        <Card className="w-full overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Audience & Tone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Audience</p>
                <p className="text-sm break-words">
                  {audience === 'all-employees' && 'All Employees'}
                  {audience === 'management' && 'Management Team'}
                  {audience === 'specific-team' && 'Specific Team/Department'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Tone</p>
                <p className="text-sm break-words">
                  {tone === 'formal' && 'Formal'}
                  {tone === 'casual' && 'Casual'}
                  {tone === 'motivational' && 'Motivational'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="w-full overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Additional Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {mandatoryPoints ? (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Mandatory Points</p>
                <p className="text-sm break-words">{mandatoryPoints}</p>
              </div>
            ) : null}
            
            {additionalContext ? (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Additional Context</p>
                <p className="text-sm break-words">{additionalContext}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No additional details provided</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 