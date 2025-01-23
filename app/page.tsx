import { SignedOut } from "@clerk/nextjs"
import { Card } from "@/components/ui/card"
import { Navigation } from "@/components/navigation"
import { GetStartedButton } from "@/components/auth-buttons"
import { BarChart3, FolderKanban, Brain, Rocket } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1">
        {/* Hero Section with Features */}
        <section className="min-h-screen px-6 py-20">
          <div className="max-w-5xl mx-auto text-center mb-20">
            <h1 className="text-5xl font-bold mb-6">
              <div>Transform Change Management</div>
              <div className="mt-2">with AI-Powered Insights</div>
            </h1>
            <p className="text-xl text-muted-foreground mb-10">
              Discover a new way to manage your projects and gain valuable insights
              with our intuitive and powerful tools.
            </p>
            <div className="flex justify-center">
              <SignedOut>
                <GetStartedButton />
              </SignedOut>
            </div>
          </div>

          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="p-6 transition-all duration-300 hover:bg-emerald-50 hover:transform hover:-translate-y-1 hover:shadow-lg">
              <div className="flex flex-col items-center text-center">
                <div className="mb-6 p-3 bg-emerald-100 rounded-lg">
                  <BarChart3 className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold mb-4">
                  Comprehensive Change Management Tools
                </h3>
                <p className="text-muted-foreground">
                  Access a suite of AI-driven features, including automated document generation and
                  insightful project analysis, to streamline every aspect of your
                  change management process.
                </p>
              </div>
            </Card>

            <Card className="p-6 transition-all duration-300 hover:bg-emerald-50 hover:transform hover:-translate-y-1 hover:shadow-lg">
              <div className="flex flex-col items-center text-center">
                <div className="mb-6 p-3 bg-emerald-100 rounded-lg">
                  <FolderKanban className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold mb-4">
                  Personalised Project Organisation
                </h3>
                <p className="text-muted-foreground">
                  Easily save and manage your insights and documents within
                  dedicated projects, ensuring all your change initiatives are
                  organised and accessible in one centralised location.
                </p>
              </div>
            </Card>

            <Card className="p-6 transition-all duration-300 hover:bg-emerald-50 hover:transform hover:-translate-y-1 hover:shadow-lg">
              <div className="flex flex-col items-center text-center">
                <div className="mb-6 p-3 bg-emerald-100 rounded-lg">
                  <Brain className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold mb-4">
                  Data-Driven Decision Making
                </h3>
                <p className="text-muted-foreground">
                  Leverage real-world case studies and AI-summarised insights to inform your
                  strategies, reduce risks, and enhance the effectiveness of
                  your change initiatives.
                </p>
              </div>
            </Card>

            <Card className="p-6 transition-all duration-300 hover:bg-emerald-50 hover:transform hover:-translate-y-1 hover:shadow-lg">
              <div className="flex flex-col items-center text-center">
                <div className="mb-6 p-3 bg-emerald-100 rounded-lg">
                  <Rocket className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold mb-4">
                  Enhanced Efficiency and Productivity
                </h3>
                <p className="text-muted-foreground">
                  Utilise advanced AI capabilities to speed up the creation and
                  refinement of change management documents, allowing you to focus on
                  strategic planning and execution.
                </p>
              </div>
            </Card>
          </div>
        </section>
      </main>

      <footer className="py-6 px-6 border-t">
        <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
          © 2023 Change Buddy. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
