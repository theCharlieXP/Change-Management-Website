import { SignedIn, SignedOut } from "@clerk/nextjs"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { GetStartedButton } from "@/components/auth-buttons"
import { BarChart3, FolderKanban, Brain, Rocket, KeyRound, FolderPlus, Search, Save, FileText, User } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { TestimonialCarousel } from "@/components/testimonial-carousel"
import { FeedbackForm } from "@/components/FeedbackForm"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="flex-1">
      {/* Hero Section with Features */}
      <section className="min-h-screen px-4 sm:px-6 pt-2 pb-12">
        <div className="max-w-5xl mx-auto text-center mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 mx-auto">
            <span className="inline-block"></span>
            <div className="mt-2">A Friendly Change Management Partner</div>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-6 px-2 mx-auto">
            Simplifying change management with AI-driven insights and practical project tools.
          </p>
          <div className="flex justify-center">
            <GetStartedButton />
          </div>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 px-2">
          <Card className="p-4 sm:p-6 transition-all duration-300 hover:bg-emerald-50 hover:transform hover:-translate-y-1 hover:shadow-lg">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 sm:mb-6 p-3 bg-emerald-100 rounded-lg">
                <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-4">
                Streamlined Change Management
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Experience a simplified approach to managing change projects with an intuitive interface and comprehensive tools.
              </p>
            </div>
          </Card>

          <Card className="p-4 sm:p-6 transition-all duration-300 hover:bg-emerald-50 hover:transform hover:-translate-y-1 hover:shadow-lg">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 sm:mb-6 p-3 bg-emerald-100 rounded-lg">
                <FolderKanban className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-4">
                Instant AI Insights
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Enter search terms and receive a concise summary generated from the most relevant information across the web.
              </p>
            </div>
          </Card>

          <Card className="p-4 sm:p-6 transition-all duration-300 hover:bg-emerald-50 hover:transform hover:-translate-y-1 hover:shadow-lg">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 sm:mb-6 p-3 bg-emerald-100 rounded-lg">
                <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-4">
                Effortless Project Organisation
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Save generated summaries directly to projects for quick access to key insights, ensuring efficient tracking and review.
              </p>
            </div>
          </Card>

          <Card className="p-4 sm:p-6 transition-all duration-300 hover:bg-emerald-50 hover:transform hover:-translate-y-1 hover:shadow-lg">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 sm:mb-6 p-3 bg-emerald-100 rounded-lg">
                <Rocket className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-4">
                Communication Assistance
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Use insights to assist in drafting change management communications—transforming insights into actionable plans.
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="px-4 sm:px-6 py-8 sm:py-16 bg-gray-50 mt-[-2rem]">
        <div className="max-w-3xl mx-auto text-center mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4">How It Works</h2>
          <p className="text-base sm:text-lg text-muted-foreground px-2">
            Get started with Change Amigo in just a few simple steps
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-3 sm:space-y-4 px-2">
          <ScrollReveal>
            <Card className="p-3 sm:p-4 h-[90px] sm:h-[100px] transition-all duration-300 hover:bg-emerald-50 hover:transform hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-center gap-3 sm:gap-4 h-full">
                <div className="shrink-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <KeyRound className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                  </div>
                </div>
                <div className="min-w-0 flex flex-col justify-center">
                  <h3 className="text-base sm:text-lg font-semibold">Sign In</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                    Log in securely using a Google account for a quick and hassle-free start.
                  </p>
                </div>
              </div>
            </Card>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <Card className="p-3 sm:p-4 h-[90px] sm:h-[100px] transition-all duration-300 hover:bg-emerald-50 hover:transform hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-center gap-3 sm:gap-4 h-full">
                <div className="shrink-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <FolderPlus className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                  </div>
                </div>
                <div className="min-w-0 flex flex-col justify-center">
                  <h3 className="text-base sm:text-lg font-semibold">Create a Project</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                    Set up a new change project by providing a name and a brief description.
                  </p>
                </div>
              </div>
            </Card>
          </ScrollReveal>

          <ScrollReveal delay={400}>
            <Card className="p-3 sm:p-4 h-[90px] sm:h-[100px] transition-all duration-300 hover:bg-emerald-50 hover:transform hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-center gap-3 sm:gap-4 h-full">
                <div className="shrink-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Search className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                  </div>
                </div>
                <div className="min-w-0 flex flex-col justify-center">
                  <h3 className="text-base sm:text-lg font-semibold">Search for Insights</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                    Enter search terms and receive a generated summary of relevant information.
                  </p>
                </div>
              </div>
            </Card>
          </ScrollReveal>

          <ScrollReveal delay={600}>
            <Card className="p-3 sm:p-4 h-[90px] sm:h-[100px] transition-all duration-300 hover:bg-emerald-50 hover:transform hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-center gap-3 sm:gap-4 h-full">
                <div className="shrink-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Save className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                  </div>
                </div>
                <div className="min-w-0 flex flex-col justify-center">
                  <h3 className="text-base sm:text-lg font-semibold">Save Your Insights</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                    Review and save summaries directly to your project for easy access.
                  </p>
                </div>
              </div>
            </Card>
          </ScrollReveal>

          <ScrollReveal delay={800}>
            <Card className="p-3 sm:p-4 h-[90px] sm:h-[100px] transition-all duration-300 hover:bg-emerald-50 hover:transform hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-center gap-3 sm:gap-4 h-full">
                <div className="shrink-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                  </div>
                </div>
                <div className="min-w-0 flex flex-col justify-center">
                  <h3 className="text-base sm:text-lg font-semibold">Document Assistance</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                    Use saved insights to help draft change management communications.
                  </p>
                </div>
              </div>
            </Card>
          </ScrollReveal>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="px-4 sm:px-6 py-12 sm:py-20">
        <div className="max-w-3xl mx-auto text-center mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4">Testimonials</h2>
          <p className="text-base sm:text-lg text-muted-foreground px-2">
            This is where testimonials will go, so if you have nice things to say about Change Amigo please reach out.
          </p>
        </div>

        <div className="relative max-w-[1272px] mx-auto">
          <div className="absolute left-0 top-0 bottom-0 w-20 sm:w-40 bg-gradient-to-r from-background via-background to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-20 sm:w-40 bg-gradient-to-l from-background via-background to-transparent z-10" />
          <TestimonialCarousel />
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact" className="px-4 sm:px-6 py-12 sm:py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4">Get in Touch</h2>
          <p className="text-base sm:text-lg text-muted-foreground px-2">
            Share your feedback, suggestions, or questions below.
          </p>
        </div>
        <FeedbackForm />
      </section>

      <footer className="py-4 sm:py-6 px-4 sm:px-6 border-t">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-xs sm:text-sm text-muted-foreground mb-2">
            © 2025 Change Amigo. All rights reserved.
          </div>
          <div className="flex justify-center space-x-4 text-xs sm:text-sm">
            <Link href="/privacy-policy" className="text-muted-foreground hover:text-emerald-600 hover:underline">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="text-muted-foreground hover:text-emerald-600 hover:underline">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
