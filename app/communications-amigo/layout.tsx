import "@/app/globals.css"
import { Inter } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: 'Communications Amigo',
  description: 'Fine-tune your communications',
}

export default function CommunicationsAmigoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} overflow-hidden`} suppressHydrationWarning>
        {children}
        <Toaster />
      </body>
    </html>
  )
} 