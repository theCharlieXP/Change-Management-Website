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
    aiPrompt: "Compose a professional and engaging email announcement clearly communicating an upcoming change initiative. Include an informative subject line, a polite greeting, and a concise yet clear introduction explaining the nature of the change and the rationale behind it. Detail specific impacts on the audience, outline required actions clearly, and incorporate all provided key points and mandatory details. Close the email with a polite, actionable call-to-action, maintaining an authoritative yet approachable tone throughout."
  },
  {
    id: 'stakeholder-memo',
    label: 'Stakeholder Update Memo',
    icon: <FileText className="h-6 w-6" />,
    description: 'Concise memo aimed at key stakeholders',
    aiPrompt: "Draft a concise, structured memo targeted at key stakeholders to provide a clear update on the ongoing change initiative. Begin with a succinct executive summary highlighting the primary reason for the update. Clearly outline key developments, expected impacts, and immediate next steps or actions required, integrating the mandatory key points provided. Use formal, precise language and organise information logically, using bullet points where appropriate for clarity."
  },
  {
    id: 'presentation-script',
    label: 'Presentation Script',
    icon: <Presentation className="h-6 w-6" />,
    description: 'Detailed script for a town hall meeting',
    aiPrompt: "Generate a detailed, conversational yet professional script suitable for a presentation discussing a significant change management initiative. Include a welcoming and engaging introduction that clearly frames the purpose of the session. Organise the script around structured main points, highlighting important data, examples, and outcomes clearly. Anticipate common questions or concerns by including a potential Q&A section. Conclude the presentation with a concise summary and an invitation for audience participation or feedback. Incorporate all provided customisation details seamlessly."
  },
  {
    id: 'faq-document',
    label: 'FAQ Document',
    icon: <MessageSquare className="h-6 w-6" />,
    description: 'Document addressing common queries about the change',
    aiPrompt: "Create a clear, organised FAQ document addressing commonly anticipated questions and concerns related to the upcoming change initiative. Structure the document into relevant thematic sections (such as Implementation, Impact on Employees, Timelines, and Next Steps). Provide concise, informative, and reassuring answers to each question, directly incorporating provided mandatory details and custom terminology. Use accessible language suitable for a wide internal audience."
  },
  {
    id: 'newsletter-article',
    label: 'Internal Newsletter Article',
    icon: <Newspaper className="h-6 w-6" />,
    description: 'Article for an internal newsletter',
    aiPrompt: "Compose an engaging, semi-formal internal newsletter article to highlight and explain recent developments within a key change initiative. Begin with an attention-grabbing headline and a concise, compelling introduction summarising the significance of the change. Clearly structured subheadings should guide readers through recent successes, specific impacts, upcoming milestones, and future objectives. Use a positive and accessible tone, integrating all mandatory points and provided context seamlessly to maintain reader interest and engagement."
  },
  {
    id: 'poster',
    label: 'Poster',
    icon: <FileImage className="h-6 w-6" />,
    description: 'Concise and visually engaging poster content',
    aiPrompt: "Generate concise, visually appealing text content suitable for a promotional poster highlighting an important change initiative. Craft a bold, memorable headline that captures immediate attention. Clearly present short bullet points highlighting key dates, benefits, or critical actions, directly incorporating all mandatory details provided. Conclude with a concise, motivating call-to-action. Maintain a lively, positive, and encouraging tone designed to engage viewers quickly and effectively."
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
          <CardContent className="p-4 flex items-center justify-between">
            <CardTitle className="text-base">{type.label}</CardTitle>
            <div className="flex-shrink-0">
              {type.icon}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 