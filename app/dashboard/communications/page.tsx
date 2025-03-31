"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Send, RefreshCw, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth"
import { cn } from "@/lib/utils"

interface Communication {
  id: string
  title: string
  content: string
  status: 'draft' | 'scheduled' | 'sent' | 'failed'
  scheduled_for: string | null
  created_at: string
  updated_at: string
  sent_at: string | null
  error_message: string | null
}

interface CommunicationTemplate {
  id: string
  name: string
  content: string
  created_at: string
  updated_at: string
}

export default function CommunicationsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const [communications, setCommunications] = useState<Communication[]>([])
  const [templates, setTemplates] = useState<CommunicationTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [selectedTab, setSelectedTab] = useState("drafts")
  const [newCommunication, setNewCommunication] = useState({
    title: "",
    content: "",
    scheduled_for: "",
  })
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    content: "",
  })
  const [showNewTemplateDialog, setShowNewTemplateDialog] = useState(false)

  useEffect(() => {
    if (user) {
      loadCommunications()
      loadTemplates()
    }
  }, [user])

  const loadCommunications = async () => {
    try {
      const { data, error } = await supabase
        .from('communications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCommunications(data || [])
    } catch (error) {
      console.error('Error loading communications:', error)
      toast({
        title: "Error",
        description: "Failed to load communications",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('communication_templates')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error('Error loading templates:', error)
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive",
      })
    }
  }

  const handleSendCommunication = async () => {
    if (!newCommunication.title || !newCommunication.content) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    setSending(true)
    try {
      const { data, error } = await supabase
        .from('communications')
        .insert([
          {
            user_id: user?.id,
            title: newCommunication.title,
            content: newCommunication.content,
            status: 'sent',
            sent_at: new Date().toISOString(),
          },
        ])
        .select()
        .single()

      if (error) throw error

      setCommunications([data, ...communications])
      setNewCommunication({ title: "", content: "", scheduled_for: "" })
      toast({
        title: "Success",
        description: "Communication sent successfully",
      })
    } catch (error) {
      console.error('Error sending communication:', error)
      toast({
        title: "Error",
        description: "Failed to send communication",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  const handleSaveTemplate = async () => {
    if (!newTemplate.name || !newTemplate.content) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    try {
      const { data, error } = await supabase
        .from('communication_templates')
        .insert([
          {
            user_id: user?.id,
            name: newTemplate.name,
            content: newTemplate.content,
          },
        ])
        .select()
        .single()

      if (error) throw error

      setTemplates([data, ...templates])
      setNewTemplate({ name: "", content: "" })
      setShowNewTemplateDialog(false)
      toast({
        title: "Success",
        description: "Template saved successfully",
      })
    } catch (error) {
      console.error('Error saving template:', error)
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive",
      })
    }
  }

  const handleUseTemplate = (template: CommunicationTemplate) => {
    setNewCommunication({
      title: template.name,
      content: template.content,
      scheduled_for: "",
    })
  }

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('communication_templates')
        .delete()
        .eq('id', templateId)

      if (error) throw error

      setTemplates(templates.filter(t => t.id !== templateId))
      toast({
        title: "Success",
        description: "Template deleted successfully",
      })
    } catch (error) {
      console.error('Error deleting template:', error)
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      })
    }
  }

  const filteredCommunications = communications.filter(comm => {
    switch (selectedTab) {
      case "drafts":
        return comm.status === 'draft'
      case "scheduled":
        return comm.status === 'scheduled'
      case "sent":
        return comm.status === 'sent'
      case "failed":
        return comm.status === 'failed'
      default:
        return true
    }
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Communications</h1>
        <Button onClick={() => setShowNewTemplateDialog(true)}>
          New Template
        </Button>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="drafts">Drafts</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab}>
          <Card>
            <CardHeader>
              <CardTitle>New Communication</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newCommunication.title}
                  onChange={(e) => setNewCommunication({
                    ...newCommunication,
                    title: e.target.value
                  })}
                  placeholder="Enter communication title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={newCommunication.content}
                  onChange={(e) => setNewCommunication({
                    ...newCommunication,
                    content: e.target.value
                  })}
                  placeholder="Enter communication content"
                  rows={5}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setNewCommunication({
                    title: "",
                    content: "",
                    scheduled_for: ""
                  })}
                >
                  Clear
                </Button>
                <Button
                  onClick={handleSendCommunication}
                  disabled={sending}
                >
                  {sending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 space-y-4">
            <h2 className="text-2xl font-semibold">Recent Communications</h2>
            <ScrollArea className="h-[400px]">
              {filteredCommunications.map((comm) => (
                <Card key={comm.id} className="mb-4">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{comm.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(comm.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {comm.status === 'sent' && (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        )}
                        {comm.status === 'failed' && (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        {comm.status === 'scheduled' && (
                          <AlertCircle className="h-5 w-5 text-yellow-500" />
                        )}
                      </div>
                    </div>
                    <p className="mt-2 text-gray-700">{comm.content}</p>
                  </CardContent>
                </Card>
              ))}
            </ScrollArea>
          </div>
        </TabsContent>
      </Tabs>

      {showNewTemplateDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <Card className="w-[500px]">
            <CardHeader>
              <CardTitle>New Template</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({
                    ...newTemplate,
                    name: e.target.value
                  })}
                  placeholder="Enter template name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-content">Template Content</Label>
                <Textarea
                  id="template-content"
                  value={newTemplate.content}
                  onChange={(e) => setNewTemplate({
                    ...newTemplate,
                    content: e.target.value
                  })}
                  placeholder="Enter template content"
                  rows={5}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowNewTemplateDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveTemplate}>
                  Save Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Saved Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold">{template.name}</h3>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUseTemplate(template)}
                      >
                        Use
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">{template.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}