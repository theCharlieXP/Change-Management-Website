import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plus } from "lucide-react"

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Projects</h1>
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Example projects - these will be dynamic in the future */}
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold mb-2">Digital Transformation</h3>
            <p className="text-muted-foreground mb-4">
              Company-wide initiative to modernize our technology stack and processes.
            </p>
            <div className="text-sm text-muted-foreground">
              Last updated: 2 days ago
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold mb-2">Process Optimization</h3>
            <p className="text-muted-foreground mb-4">
              Streamlining customer service workflows for better efficiency.
            </p>
            <div className="text-sm text-muted-foreground">
              Last updated: 5 days ago
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center hover:border-emerald-600 cursor-pointer group">
            <Plus className="w-8 h-8 text-muted-foreground group-hover:text-emerald-600 mb-2" />
            <p className="text-muted-foreground group-hover:text-emerald-600">
              Create a new project
            </p>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
} 