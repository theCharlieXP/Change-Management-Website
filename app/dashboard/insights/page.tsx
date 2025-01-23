import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export default function InsightsPage() {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Insights</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input 
              placeholder="Search for insights, case studies, or topics..." 
              className="pl-10 bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="text-sm text-emerald-600 font-medium mb-2">Case Study</div>
            <h3 className="text-xl font-semibold mb-2">
              Digital Transformation Success at Global Tech Corp
            </h3>
            <p className="text-muted-foreground mb-4">
              Learn how Global Tech Corp successfully implemented a company-wide digital
              transformation initiative, increasing productivity by 40%.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Tech Industry</span>
              <span>•</span>
              <span>10 min read</span>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="text-sm text-emerald-600 font-medium mb-2">Research</div>
            <h3 className="text-xl font-semibold mb-2">
              Employee Engagement During Change
            </h3>
            <p className="text-muted-foreground mb-4">
              New research reveals key strategies for maintaining high employee
              engagement during organizational change initiatives.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>HR</span>
              <span>•</span>
              <span>8 min read</span>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="text-sm text-emerald-600 font-medium mb-2">Trend Analysis</div>
            <h3 className="text-xl font-semibold mb-2">
              Change Management in 2024
            </h3>
            <p className="text-muted-foreground mb-4">
              Explore the emerging trends and technologies shaping the future of
              change management in organizations.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Industry Trends</span>
              <span>•</span>
              <span>12 min read</span>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="text-sm text-emerald-600 font-medium mb-2">Best Practices</div>
            <h3 className="text-xl font-semibold mb-2">
              Effective Stakeholder Communication
            </h3>
            <p className="text-muted-foreground mb-4">
              A comprehensive guide to maintaining clear and effective communication
              with stakeholders throughout change initiatives.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Communication</span>
              <span>•</span>
              <span>15 min read</span>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
} 