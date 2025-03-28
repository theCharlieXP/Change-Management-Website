'use client';

import React from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Handshake } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Navigation() {
  const pathname = usePathname();

  const handleContactClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Only handle the scroll if we're on the home page
    if (pathname === '/') {
      e.preventDefault();
      const contactSection = document.getElementById('contact');
      if (contactSection) {
        contactSection.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    }
  };

  return (
    <nav className="w-full px-6 flex flex-col">
      {/* Top bar with contact button */}
      <div className="w-full py-2 flex justify-end">
        <Link 
          href={pathname === '/' ? '#contact' : '/#contact'}
          onClick={handleContactClick}
        >
          <Button variant="ghost" className="text-sm text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
            Contact
          </Button>
        </Link>
      </div>
      
      {/* Centered logo section */}
      <div className="flex justify-center items-center py-6 relative">
        {/* Decorative background elements */}
        <div className="absolute inset-0 flex justify-center items-center">
          <div className="w-[600px] h-[150px] bg-gradient-to-r from-emerald-50/0 via-emerald-50 to-emerald-50/0 rounded-full blur-2xl" />
        </div>
        
        <style jsx>{`
          @keyframes handshake {
            0% { transform: rotate(0deg) translateY(0); }
            25% { transform: rotate(-10deg) translateY(-2px); }
            50% { transform: rotate(0deg) translateY(0); }
            75% { transform: rotate(10deg) translateY(-2px); }
            100% { transform: rotate(0deg) translateY(0); }
          }
          .handshake-hover:hover {
            animation: handshake 0.5s ease-in-out infinite;
          }
        `}</style>
        
        <div className="flex items-center gap-4 relative group">
          {/* Logo container with enhanced hover effects */}
          <div className="relative handshake-hover">
            <Handshake 
              className="w-16 h-16 text-emerald-600 stroke-[1.5] transition-colors duration-500 
                group-hover:text-emerald-500" 
            />
          </div>
          
          {/* Text with gradient and animation */}
          <div className="relative">
            <span className="text-6xl font-bold bg-gradient-to-br from-emerald-600 to-emerald-800 text-transparent bg-clip-text 
              transition-all duration-500 
              group-hover:from-emerald-500 
              group-hover:to-emerald-700
              drop-shadow-[0_2px_2px_rgba(4,120,87,0.4)]
              [text-shadow:_2px_2px_2px_rgb(4_120_87_/_20%)]">
              Change Amigo
            </span>
          </div>
        </div>
      </div>
    </nav>
  )
} 