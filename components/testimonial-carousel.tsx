'use client'

import { Card } from "@/components/ui/card"
import { User } from "lucide-react"

const testimonials = [
  {
    name: "Imaginary Fan",
    role: "Definitely Real Person",
    content: "Wow, this is revolutionary! I've never seen anything like it. My life is forever changed."
  },
  {
    name: "Fictional Enthusiast",
    role: "Professional Opinion-Haver",
    content: "Whoever made this is an absolute genius. Nobel Prize worthy, if you ask me."
  },
  {
    name: "Future Customer",
    role: "Change Management Wizard",
    content: "I'd give this 6 stars if I could. It's like having a change management expert in my pocket!"
  },
  {
    name: "Potential Client",
    role: "Very Important Executive",
    content: "My productivity increased by 500% after using this tool. Or it would, if I had actually used it yet."
  },
  {
    name: "Eager Reviewer",
    role: "First-Time Testimonial Writer",
    content: "I was told there would be cookies if I wrote a nice review. Still waiting on those cookies..."
  }
]

export function TestimonialCarousel() {
  return (
    <div className="w-full overflow-hidden">
      <div 
        className="flex gap-12 animate-scroll"
      >
        {/* First set */}
        {testimonials.map((testimonial, index) => (
          <Card 
            key={`first-${index}`} 
            className="flex-shrink-0 w-[500px] h-[250px] p-8 transition-all duration-300 hover:bg-emerald-50 hover:transform hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center">
                  <User className="w-7 h-7 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{testimonial.name}</h3>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-muted-foreground text-base leading-relaxed whitespace-normal">{testimonial.content}</p>
              </div>
            </div>
          </Card>
        ))}
        {/* Second set (duplicate for infinite scroll) */}
        {testimonials.map((testimonial, index) => (
          <Card 
            key={`second-${index}`} 
            className="flex-shrink-0 w-[500px] h-[250px] p-8 transition-all duration-300 hover:bg-emerald-50 hover:transform hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center">
                  <User className="w-7 h-7 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{testimonial.name}</h3>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-muted-foreground text-base leading-relaxed whitespace-normal">{testimonial.content}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <style jsx>{`
        .animate-scroll {
          animation: scroll 40s linear infinite;
          will-change: transform;
        }
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(calc(-${testimonials.length * 512}px));
          }
        }
      `}</style>
    </div>
  )
} 