'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { ExternalLink, BookmarkPlus } from "lucide-react"
import { InsightFocusArea } from "@/types/insights"

interface InsightCardProps {
  title: string
  description: string
  summary: string
  url: string
  focusArea: InsightFocusArea
  onSave?: (url: string) => void
}

export function InsightCard({ title, description, summary, url, focusArea, onSave }: InsightCardProps) {
  const formatFocusArea = (area: InsightFocusArea) => {
    return area.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  return (
    <Card className="w-full transition-all hover:shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-semibold line-clamp-2">{title}</CardTitle>
            <CardDescription className="mt-2 line-clamp-2">{description}</CardDescription>
          </div>
          {focusArea && (
            <Badge variant="outline" className="shrink-0">
              {formatFocusArea(focusArea)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm text-muted-foreground">
          {summary.split('\n').map((point, index) => (
            <p key={index} className="flex items-start gap-2">
              {point}
            </p>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm" onClick={() => window.open(url, '_blank')}>
          <ExternalLink className="mr-2 h-4 w-4" />
          View Source
        </Button>
        {onSave && (
          <Button variant="ghost" size="sm" onClick={() => onSave(url)}>
            <BookmarkPlus className="mr-2 h-4 w-4" />
            Save Insight
          </Button>
        )}
      </CardFooter>
    </Card>
  )
} 