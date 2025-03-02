import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CommunicationType } from './communication-type-selection'

interface CommunicationCustomizationProps {
  communicationType: CommunicationType
  mandatoryPoints: string
  setMandatoryPoints: (value: string) => void
  audience: 'all-employees' | 'management' | 'specific-team'
  setAudience: (value: 'all-employees' | 'management' | 'specific-team') => void
  tone: 'formal' | 'casual' | 'motivational'
  setTone: (value: 'formal' | 'casual' | 'motivational') => void
  additionalContext: string
  setAdditionalContext: (value: string) => void
}

export function CommunicationCustomization({
  communicationType,
  mandatoryPoints,
  setMandatoryPoints,
  audience,
  setAudience,
  tone,
  setTone,
  additionalContext,
  setAdditionalContext
}: CommunicationCustomizationProps) {
  return (
    <div className="space-y-4 w-full" style={{ maxWidth: "100%" }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full" style={{ maxWidth: "100%" }}>
        <div className="space-y-3 w-full overflow-hidden">
          <Label htmlFor="audience">Target Audience</Label>
          <RadioGroup 
            id="audience" 
            value={audience} 
            onValueChange={(value) => setAudience(value as any)}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all-employees" id="all-employees" className="flex-shrink-0" />
              <Label htmlFor="all-employees" className="font-normal">All Employees</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="management" id="management" className="flex-shrink-0" />
              <Label htmlFor="management" className="font-normal">Management Team</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="specific-team" id="specific-team" className="flex-shrink-0" />
              <Label htmlFor="specific-team" className="font-normal">Specific Team/Department</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-3 w-full overflow-hidden">
          <Label htmlFor="tone">Communication Tone</Label>
          <RadioGroup 
            id="tone" 
            value={tone} 
            onValueChange={(value) => setTone(value as any)}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="formal" id="formal" className="flex-shrink-0" />
              <Label htmlFor="formal" className="font-normal">Formal</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="casual" id="casual" className="flex-shrink-0" />
              <Label htmlFor="casual" className="font-normal">Casual</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="motivational" id="motivational" className="flex-shrink-0" />
              <Label htmlFor="motivational" className="font-normal">Motivational</Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      <div className="space-y-3 w-full overflow-hidden">
        <Label htmlFor="mandatory-points">
          Mandatory Points to Include
          <span className="text-xs text-muted-foreground ml-2">(Optional)</span>
        </Label>
        <Textarea
          id="mandatory-points"
          placeholder="Enter any specific points that must be included in the communication..."
          value={mandatoryPoints}
          onChange={(e) => setMandatoryPoints(e.target.value)}
          className="min-h-[100px] w-full resize-none"
        />
      </div>

      <div className="space-y-3 w-full overflow-hidden">
        <Label htmlFor="additional-context">
          Additional Context
          <span className="text-xs text-muted-foreground ml-2">(Optional)</span>
        </Label>
        <Textarea
          id="additional-context"
          placeholder="Provide any additional context or information that might be helpful..."
          value={additionalContext}
          onChange={(e) => setAdditionalContext(e.target.value)}
          className="min-h-[100px] w-full resize-none"
        />
      </div>
    </div>
  )
} 