import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, FileText, Presentation, Megaphone } from 'lucide-react'
import { cn } from '@/lib/utils'

export type CommunicationType = 'email' | 'poster' | 'script' | 'other'

interface CommunicationTypeOption {
  id: CommunicationType
  label: string
  icon: React.ReactNode
  description: string
}

const communicationTypes: CommunicationTypeOption[] = [
  {
    id: 'email',
    label: 'Email',
    icon: <Mail className="h-6 w-6" />,
    description: 'Create an email to send to stakeholders'
  },
  {
    id: 'poster',
    label: 'Poster',
    icon: <FileText className="h-6 w-6" />,
    description: 'Create a poster or announcement'
  },
  {
    id: 'script',
    label: 'Script',
    icon: <Presentation className="h-6 w-6" />,
    description: 'Create a script for a presentation or meeting'
  },
  {
    id: 'other',
    label: 'Other',
    icon: <Megaphone className="h-6 w-6" />,
    description: 'Create a custom communication'
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