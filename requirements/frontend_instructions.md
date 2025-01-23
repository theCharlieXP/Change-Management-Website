# Project overview
Use this guide to build a comprehensive platform that empowers change managers by leveraging AI to aggregate, summarize, and provide actionable insights from relevant news and case studies related to their change projects.

# Feature requirements
- We will use Next.js, Shadcn, Supabase, Deepseek, Tavily, Vercel, Clerk.
- Have a landing page that provides an overview of the website with the ability to sign in and then once you are signed in you will be able to see a menu bar along the left hand side that will take you to your projects and to the insights page.
- The projects page will have a list of all your projects with the ability to add a new project or click on a project to see the details such as project notes, project status, and any insights that were saved from the insights page.
The Inquiry Section allows users to input a description of their change project and fine-tune their search for insights using various toggles and filters such as change type, industry, date range, region, and insight depth.
-Have a responsive design that looks good on both mobile and desktop.
- Have a clean and modern design.
- Have a consistent color scheme.
- Have a consistent font family.
- Have a consistent font size.
- Have a consistent line height.
- Have a consistent letter spacing.

# Relvant docs
# # How to use Deepseek
// Please install OpenAI SDK first: `npm install openai`

import OpenAI from "openai";

const openai = new OpenAI({
        baseURL: 'https://api.deepseek.com',
        apiKey: '<DeepSeek API Key>'
});

async function main() {
  const completion = await openai.chat.completions.create({
    messages: [{ role: "system", content: "You are a helpful assistant." }],
    model: "deepseek-chat",
  });

  console.log(completion.choices[0].message.content);
}

main();

# # How to use Tavily
📦 Installing

pip install tavily-python

🛠️ Usage

Below are some code snippets that show you how to interact with our API. The different steps and components of this code are explained in more detail on the Python API Reference page.

Getting and printing the full Search API response

from tavily import TavilyClient

# Step 1. Instantiating your TavilyClient
tavily_client = TavilyClient(api_key="tvly-YOUR_API_KEY")

# Step 2. Executing a simple search query
response = tavily_client.search("Who is Leo Messi?")

# Step 3. That's it! You've done a Tavily Search!
print(response)

This is equivalent to directly querying our REST API.

Generating context for a RAG Application

from tavily import TavilyClient

# Step 1. Instantiating your TavilyClient
tavily_client = TavilyClient(api_key="tvly-YOUR_API_KEY")

# Step 2. Executing a context search query
context = tavily_client.get_search_context(query="What happened during the Burning Man floods?")

# Step 3. That's it! You now have a context string that you can feed directly into your RAG Application
print(context)


This is how you can generate precise and fact-based context for your RAG application in one line of code.

Getting a quick answer to a question

from tavily import TavilyClient

# Step 1. Instantiating your TavilyClient
tavily_client = TavilyClient(api_key="tvly-YOUR_API_KEY")

# Step 2. Executing a Q&A search query
answer = tavily_client.qna_search(query="Who is Leo Messi?")

# Step 3. That's it! Your question has been answered!
print(answer)

This is how you get accurate and concise answers to questions, in one line of code. Perfect for usage by LLMs!

This snippet shows you how to set up a Tavily Hybrid RAG Client and connect it to a MongoDB database to perform a simple Hybrid RAG query! For more information on how to set up your


# # How to use Clerk
Install @clerk/nextjs

Clerk's Next.js SDK gives you access to prebuilt components, React hooks, and helpers to make user authentication easier.

Run the following command to install the SDK:

npm
yarn
pnpm
terminal

npm install @clerk/nextjs
Set your Clerk API keys

In the Clerk Dashboard, navigate to the API keys page.
In the Quick Copy section, copy your Clerk Publishable and Secret Keys.
Paste your keys into your .env.local file.
The final result should resemble the following:

.env.local

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
CLERK_SECRET_KEY=YOUR_SECRET_KEY
Add clerkMiddleware() to your app

clerkMiddleware() grants you access to user authentication state throughout your app, on any route or page. It also allows you to protect specific routes from unauthenticated users. To add clerkMiddleware() to your app, follow these steps:

Create a middleware.ts file.

If you're using the /src directory, create middleware.ts in the /src directory.
If you're not using the /src directory, create middleware.ts in the root directory alongside .env.local.
In your middleware.ts file, export the clerkMiddleware() helper:

middleware.ts

import { clerkMiddleware } from '@clerk/nextjs/server'

export default clerkMiddleware()

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
By default, clerkMiddleware() will not protect any routes. All routes are public and you must opt-in to protection for routes. See the clerkMiddleware() reference to learn how to require authentication for specific routes.

Add <ClerkProvider> and Clerk components to your app

The <ClerkProvider> component provides session and user context to Clerk's hooks and components. It's recommended to wrap your entire app at the entry point with <ClerkProvider> to make authentication globally accessible. See the reference docs for other configuration options.

You can control which content signed-in and signed-out users can see with Clerk's prebuilt control components. Create a header using the following components:

<SignedIn>: Children of this component can only be seen while signed in.
<SignedOut>: Children of this component can only be seen while signed out.
<UserButton />: Shows the signed-in user's avatar. Selecting it opens a dropdown menu with account management options.
<SignInButton />: An unstyled component that links to the sign-in page. In this example, since no props or environment variables are set for the sign-in URL, this component links to the Account Portal sign-in page.
Select your preferred router to learn how to make this data available across your entire app:

App Router
Pages Router
app/layout.tsx

import { ClerkProvider, SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <header>
            <SignedOut>
              <SignInButton />
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </header>
          <main>{children}</main>
        </body>
      </html>
    </ClerkProvider>
  )
}
Create your first user

Run your project with the following command:

npm
yarn
pnpm
terminal

# Current file structure
CHANGE-MAN-WEBSITE
├── .next/
├── app/
│   ├── fonts/
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── ui/
│       ├── button.tsx
│       ├── card.tsx
│       ├── collapsible.tsx
│       ├── input.tsx
│       ├── navigation-menu.tsx
│       ├── progress.tsx
│       └── separator.tsx
├── lib/
│   └── utils.ts
├── node_modules/
├── requirements/
├── .eslintrc.json
├── .gitignore
├── components.json
├── next-env.d.ts
├── next.config.mjs
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── README.md
├── tailwind.config.ts
└── tsconfig.json

# Rules
- All new components should go in /components and be named like example-component.tsx unless otherwise specified.
- All new pages go in /app
