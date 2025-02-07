import React from 'react'
import Link from 'next/link'
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs"
import { NavigationMenu, NavigationMenuItem, NavigationMenuList } from "@/components/ui/navigation-menu"
import { Button } from "@/components/ui/button"

export function Navigation() {
  return (
    <nav className="w-full px-6 py-4 flex items-center justify-between border-b">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-emerald-500 rounded-full" />
        <Link href="/" className="text-xl font-semibold">
          Change Buddy
        </Link>
      </div>

      <NavigationMenu>
        <NavigationMenuList className="gap-6">
          <NavigationMenuItem>
            <Link href="/about" className="text-sm text-muted-foreground hover:text-emerald-600 transition-colors">
              About
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href="/features" className="text-sm text-muted-foreground hover:text-emerald-600 transition-colors">
              Features
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href="/contact" className="text-sm text-muted-foreground hover:text-emerald-600 transition-colors">
              Contact
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <SignedIn>
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "hover:ring-2 hover:ring-emerald-600 transition-all",
                  }
                }}
              />
            </SignedIn>
            <SignedOut>
              <Link href="/sign-in">
                <Button variant="ghost" className="text-sm">
                  Sign In
                </Button>
              </Link>
            </SignedOut>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </nav>
  )
} 