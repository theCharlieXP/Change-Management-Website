import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, FileText, Presentation, MessageSquare, Newspaper, FileImage } from 'lucide-react'
import { cn } from '@/lib/utils'

export type CommunicationType = 'email-announcement' | 'stakeholder-memo' | 'presentation-script' | 'faq-document' | 'newsletter-article' | 'poster'

export interface CommunicationTypeOption {
  id: CommunicationType
  label: string
  icon: React.ReactNode
  description: string
  aiPrompt: string
}

export const communicationTypes: CommunicationTypeOption[] = [
  {
    id: 'email-announcement',
    label: 'Email Announcement',
    icon: <Mail className="h-6 w-6" />,
    description: 'Formal email announcement for a change initiative',
    aiPrompt: "Compose a formal email announcement for a change initiative. Include a subject line, a courteous greeting, a clear introduction explaining the change, the rationale behind it, details of the impact, any necessary actions, and a polite closing with a call to action. Maintain a professional and clear tone throughout."
  },
  {
    id: 'stakeholder-memo',
    label: 'Stakeholder Update Memo',
    icon: <FileText className="h-6 w-6" />,
    description: 'Concise memo aimed at key stakeholders',
    aiPrompt: "Draft a concise memo aimed at key stakeholders. Start with an executive summary, then outline the key points of the change initiative, the expected impacts, and any immediate actions required. Use formal language and a structured, bullet-point format where necessary."
  },
  {
    id: 'presentation-script',
    label: 'Town Hall Presentation Script',
    icon: <Presentation className="h-6 w-6" />,
    description: 'Detailed script for a town hall meeting',
    aiPrompt: "Generate a detailed script for a town hall meeting on a change management initiative. Begin with an engaging introduction, then list the main discussion points, data highlights or examples, potential Q&A sections, and a conclusion that invites feedback. Use an engaging yet professional tone throughout."
  },
  {
    id: 'faq-document',
    label: 'FAQ Document',
    icon: <MessageSquare className="h-6 w-6" />,
    description: 'Document addressing common queries about the change',
    aiPrompt: "Create an FAQ document that addresses common queries regarding the change initiative. Organise it into clearly labelled questions and concise answers. Include sections where applicable to categorise the questions (e.g., implementation, impact, next steps) and maintain an accessible tone."
  },
  {
    id: 'newsletter-article',
    label: 'Internal Newsletter Article',
    icon: <Newspaper className="h-6 w-6" />,
    description: 'Article for an internal newsletter',
    aiPrompt: "Compose an internal newsletter article that highlights recent change initiatives. The article should feature a captivating headline, sub-headings, a brief summary of the changes, success stories, and future plans. Use a semi-formal and engaging tone that is easy for a broad internal audience to understand."
  },
  {
    id: 'poster',
    label: 'Poster/Flyer',
    icon: <FileImage className="h-6 w-6" />,
    description: 'Concise and visually engaging poster content',
    aiPrompt: "Generate content for a poster to promote a change initiative. Keep the message concise and visually engaging. Use a bold headline, short bullet points summarising key benefits or dates, and a clear call-to-action. The tone should be catchy and motivating."
  }
]

interface CommunicationTypeSelectionProps {
  selectedType: CommunicationType | null
  onTypeSelect: (type: CommunicationType) => void
}

export function CommunicationTypeSelection({
  selectedType,
  onTypeSelect
}: CommunicationTypeSelectionProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full" style={{ maxWidth: "100%" }}>
      {communicationTypes.map((type) => (
        <Card 
          key={type.id}
          className={cn(
            "cursor-pointer transition-all hover:shadow-md w-full overflow-hidden",
            selectedType === type.id ? "border-primary ring-2 ring-primary/20" : "border-border"
          )}
          onClick={() => onTypeSelect(type.id)}
        >
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base truncate">{type.label}</CardTitle>
              <div className="flex-shrink-0 ml-2">
                {type.icon}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <p className="text-xs text-muted-foreground break-words">{type.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 