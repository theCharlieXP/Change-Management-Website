'use client'

import { UserButton } from "@clerk/nextjs"

function UserNav() {
  return (
    <UserButton 
      afterSignOutUrl="/"
      appearance={{
        elements: {
          avatarBox: "w-10 h-10 rounded-full",
        }
      }}
    />
  )
}

export { UserNav } 