import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { CommunicationType } from './communication-type-selection'
import { Info, FileText } from 'lucide-react'
import { FileUpload } from '@/components/ui/file-upload'

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
  // New props for enhanced customization
  title: string
  setTitle: (value: string) => void
  style: 'narrative' | 'bullet-points' | 'mixed'
  setStyle: (value: 'narrative' | 'bullet-points' | 'mixed') => void
  detailLevel: number
  setDetailLevel: (value: number) => void
  formatting: 'paragraphs' | 'bullets' | 'numbered' | 'mixed'
  setFormatting: (value: 'paragraphs' | 'bullets' | 'numbered' | 'mixed') => void
  callToAction: string
  setCallToAction: (value: string) => void
  customTerminology: string
  setCustomTerminology: (value: string) => void
  additionalInstructions: string
  setAdditionalInstructions: (value: string) => void
  // Document upload props
  referenceDocuments: File[]
  setReferenceDocuments: (files: File[]) => void
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
  setAdditionalContext,
  // New props for enhanced customization
  title,
  setTitle,
  style,
  setStyle,
  detailLevel,
  setDetailLevel,
  formatting,
  setFormatting,
  callToAction,
  setCallToAction,
  customTerminology,
  setCustomTerminology,
  additionalInstructions,
  setAdditionalInstructions,
  // Document upload props
  referenceDocuments,
  setReferenceDocuments
}: CommunicationCustomizationProps) {
  // Get communication type display name
  const getCommunicationTypeDisplay = () => {
    switch (communicationType) {
      case 'email-announcement': return 'Email Announcement'
      case 'stakeholder-memo': return 'Stakeholder Update Memo'
      case 'presentation-script': return 'Town Hall Presentation Script'
      case 'faq-document': return 'FAQ Document'
      case 'newsletter-article': return 'Internal Newsletter Article'
      case 'poster': return 'Poster/Flyer'
      default: return 'Communication'
    }
  }

  const handleFilesSelected = (files: File[]) => {
    setReferenceDocuments([...referenceDocuments, ...files]);
  };

  const handleRemoveFile = (index: number) => {
    const updatedFiles = [...referenceDocuments];
    updatedFiles.splice(index, 1);
    setReferenceDocuments(updatedFiles);
  };

  return (
    <div className="space-y-4 w-full" style={{ maxWidth: "100%" }}>
      <h2 className="text-xl font-bold">Customize Your {getCommunicationTypeDisplay()}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Title/Subject Line */}
        <div className="space-y-1.5">
          <Label htmlFor="title" className="text-sm font-medium">
            {communicationType === 'email-announcement' ? 'Subject Line' : 'Title/Headline'}
          </Label>
          <Input 
            id="title" 
            placeholder={communicationType === 'email-announcement' 
              ? "Enter subject line..." 
              : "Enter title/headline..."
            }
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Target Audience */}
        <div className="space-y-1.5">
          <Label htmlFor="audience" className="text-sm font-medium">Target Audience</Label>
          <Select 
            value={audience} 
            onValueChange={(value: 'all-employees' | 'management' | 'specific-team') => setAudience(value)}
          >
            <SelectTrigger id="audience">
              <SelectValue placeholder="Select audience" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-employees">All Employees</SelectItem>
              <SelectItem value="management">Management Team</SelectItem>
              <SelectItem value="specific-team">Specific Team/Department</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tone */}
        <div className="space-y-1.5">
          <Label htmlFor="tone" className="text-sm font-medium">Communication Tone</Label>
          <Select 
            value={tone} 
            onValueChange={(value: 'formal' | 'casual' | 'motivational') => setTone(value)}
          >
            <SelectTrigger id="tone">
              <SelectValue placeholder="Select tone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="formal">Formal and Professional</SelectItem>
              <SelectItem value="casual">Friendly and Engaging</SelectItem>
              <SelectItem value="motivational">Concise and Direct</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Style */}
        <div className="space-y-1.5">
          <Label htmlFor="style" className="text-sm font-medium">Stylistic Approach</Label>
          <Select 
            value={style} 
            onValueChange={(value: 'narrative' | 'bullet-points' | 'mixed') => setStyle(value)}
          >
            <SelectTrigger id="style">
              <SelectValue placeholder="Select style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="narrative">Narrative (flowing paragraphs)</SelectItem>
              <SelectItem value="bullet-points">Bullet Points (concise lists)</SelectItem>
              <SelectItem value="mixed">Mixed (combination of both)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Formatting */}
        <div className="space-y-1.5">
          <Label htmlFor="formatting" className="text-sm font-medium">Formatting Preferences</Label>
          <Select 
            value={formatting} 
            onValueChange={(value: 'paragraphs' | 'bullets' | 'numbered' | 'mixed') => setFormatting(value)}
          >
            <SelectTrigger id="formatting">
              <SelectValue placeholder="Select formatting" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="paragraphs">Primarily Paragraphs</SelectItem>
              <SelectItem value="bullets">Primarily Bullet Points</SelectItem>
              <SelectItem value="numbered">Primarily Numbered Lists</SelectItem>
              <SelectItem value="mixed">Mixed Format</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Detail Level */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <Label htmlFor="detail-level" className="text-sm font-medium">Detail Level</Label>
            <span className="text-xs text-muted-foreground">
              {detailLevel < 33 ? 'Brief' : detailLevel < 66 ? 'Standard' : 'Detailed'}
            </span>
          </div>
          <Slider
            id="detail-level"
            defaultValue={[50]}
            max={100}
            step={1}
            value={[detailLevel]}
            onValueChange={(value) => setDetailLevel(value[0])}
            className="py-1"
          />
        </div>
      </div>

      {/* Key Points / Must-Include Details */}
      <div className="space-y-1.5">
        <Label htmlFor="mandatory-points" className="text-sm font-medium">
          Key Points / Must-Include Details
        </Label>
        <Textarea
          id="mandatory-points"
          placeholder="List specific information that must be included..."
          value={mandatoryPoints}
          onChange={(e) => setMandatoryPoints(e.target.value)}
          className="min-h-[80px] w-full resize-none"
        />
      </div>

      {/* Call-to-Action (CTA) */}
      <div className="space-y-1.5">
        <Label htmlFor="call-to-action" className="text-sm font-medium">
          Call-to-Action (CTA)
        </Label>
        <Textarea
          id="call-to-action"
          placeholder="Specify actions recipients should take..."
          value={callToAction}
          onChange={(e) => setCallToAction(e.target.value)}
          className="min-h-[80px] w-full resize-none"
        />
      </div>

      {/* Context and Background Information */}
      <div className="space-y-1.5">
        <Label htmlFor="additional-context" className="text-sm font-medium">
          Context and Background
        </Label>
        <Textarea
          id="additional-context"
          placeholder="Provide background about the change initiative..."
          value={additionalContext}
          onChange={(e) => setAdditionalContext(e.target.value)}
          className="min-h-[80px] w-full resize-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Custom Terminology */}
        <div className="space-y-1.5">
          <Label htmlFor="custom-terminology" className="text-sm font-medium">
            Custom Terminology
          </Label>
          <Textarea
            id="custom-terminology"
            placeholder="List specific terms or branding elements..."
            value={customTerminology}
            onChange={(e) => setCustomTerminology(e.target.value)}
            className="min-h-[80px] w-full resize-none"
          />
        </div>

        {/* Additional Instructions */}
        <div className="space-y-1.5">
          <Label htmlFor="additional-instructions" className="text-sm font-medium">
            Additional Instructions
          </Label>
          <Textarea
            id="additional-instructions"
            placeholder="Any other specific requirements..."
            value={additionalInstructions}
            onChange={(e) => setAdditionalInstructions(e.target.value)}
            className="min-h-[80px] w-full resize-none"
          />
        </div>
      </div>

      {/* Reference Documents Upload - Moved to bottom */}
      <div className="space-y-1.5 mt-2">
        <Label htmlFor="reference-documents" className="text-sm font-medium flex items-center gap-1.5">
          <FileText className="h-4 w-4" />
          Reference Documents
        </Label>
        <FileUpload
          onFilesSelected={handleFilesSelected}
          uploadedFiles={referenceDocuments}
          onRemoveFile={handleRemoveFile}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Upload documents to provide additional context for the AI (e.g., company policies, previous communications)
        </p>
      </div>

      <div className="bg-muted/30 p-3 rounded-md flex items-start gap-2 text-xs">
        <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-muted-foreground">
          For best results, provide clear details in the fields above. Uploaded documents will be analysed by the AI to better understand your organisation's context and terminology.
        </p>
      </div>
    </div>
  )
} 