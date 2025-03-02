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

# Landing Page Design
Section 1: Hero & Feature Cards
Hero Header
Content:
Headline:
"Welcome to Change Amigo – A Friendly Change Management Partner"
Subheading:
"Simplifying change management with AI-driven insights and practical project tools."
Call-to-Action:
A prominently placed “Get Started” button in emerald green.
Design:
A full-width hero section featuring a professional background image (such as a modern office scene with subtle abstract elements). The text is centre-aligned, and ample whitespace is used to maintain a clean appearance. The button should have a gentle hover effect.
Four Feature Cards

Positioned immediately below the hero header in a responsive grid (displayed side by side on larger screens and stacking vertically on mobile). Each card should have a white background, softly rounded corners, a light drop shadow, and emerald green accents (such as borders or icons).

Streamlined Change Management
"Experience a simplified approach to managing change projects with an intuitive interface and comprehensive tools."
Instant AI Insights
"Enter search terms and receive a concise summary generated from the most relevant information across the web."
Effortless Project Organisation
"Save generated summaries directly to projects for quick access to key insights, ensuring efficient tracking and review."
Coming Soon: Document & Communication Assistance
"Soon, saved insights will be used to assist in drafting change management documents and communications—transforming insights into actionable plans."

Section 2: How It Works – Step-by-Step Guide
This section appears as the user scrolls down, with each step presented in its own card or panel featuring a clear number, an appropriate icon, and a brief description.

Sign In:
"Log in securely using a Google account for a quick and hassle-free start."
Create a Project:
"Set up a new change project by providing a name and a brief description, ensuring proper organisation from the outset."
Search for Insights:
"Enter search terms and receive a generated summary that encapsulates the most relevant information available."
Save Your Insights:
"Review the summary and save it directly to the project, making all key findings easily accessible."
Coming Soon – Document & Communication Assistance:
"Soon, saved insights will be used to help draft change management documents and communications, turning analysis into actionable plans."
Design:
Each step card includes a clear icon (for example: a key for Sign In, a folder for Create Project, a magnifying glass for Search, a save icon for Save, and a document icon for the upcoming feature). The cards should animate (slide or fade in) as the user scrolls.

Section 3: Testimonials Slider
Below the step-by-step guide, include a testimonials section with a humorous, tongue-in-cheek note acknowledging that no testimonials are available yet.
Title & Intro Text:
Heading: "Testimonials"
Subtext:
"As can be seen, there are no testimonials yet. Perhaps a fortunate user might be the first to leave one. Short and to the point—maybe even a testimonial from a satisfied user like this."
Design:
Use white, curved rectangular cards arranged side by side in a horizontal slider that slowly moves across the screen. Each card should include a placeholder for testimonial text and a small placeholder avatar. The overall style remains clean and professional.

Section 4: Contact / Feedback
At the bottom of the page, provide a simple contact form.
Title:
"Get in Touch"
Content:
"If there are any questions, ideas, or feedback about Change Amigo, please use the form below to share them. Every input is appreciated."
Form Fields:
Name, Email, and Message, with a “Send Feedback” button styled in emerald green.
Design:
The contact form should be clearly laid out with well-spaced input fields and labels, set against a slightly contrasting background (a very light grey or subtle pattern) to differentiate it from the rest of the page. Ensure responsiveness for both desktop and mobile devices.

# Communications Page Flow
1. Entry Point & Project Selection
A. Landing on the Communications Section
Dashboard Access:
The user logs in and sees a “Communications” button or tab on the main dashboard.
On clicking, they are taken to a dedicated communications workspace.
B. Project Selection
Project List:
The first screen presents a dropdown menu with project names from which the user selects the project for which they wish to create a communication.
Project Context:
Once a project is selected, the system loads relevant data, such as saved insights and notes linked to that project.

2. Selecting and Customising Insights
A. Displaying Saved Insights
Insights Panel:
A separate panel shows all the insights and notes saved for the selected project.
Each insight is displayed with the short title and insight focus area pill with the option to expand the insight to see the full insight.
B. User Selection
Choosing Content:
The user selects which insights they want to incorporate by ticking checkboxes.
Filtering Options:
Include search and filter functionality (e.g. by date, focus area, or keywords) to help the user quickly find the most relevant insights.

3. Communication Type & Customisation
A. Selecting the Communication Type
Type Options:
The next step requires the user to choose a communication type. Options could be presented as:
Email
Poster
Script
Other formats (customisable if needed)
This can be done using icons.
B. Customisation Inputs
Essential Details:
Provide dedicated input fields where the user can add vital information, such as:
Mandatory Mentions: A text box for “must mention” points (e.g. key dates, figures, or messages).
Audience/Tone: Options or toggles for tone (e.g. formal vs casual) and audience specifics.
Additional Context: A field for any extra notes or instructions that need to be included in the communication.
Interactive Buttons:
Include buttons or sliders to further customise style (for example, adjusting the length or formality of the content).

4. Review and Confirmation of Selections
A. Summary Screen
Consolidated Overview:
Before generating the communication, display a summary screen that shows:
The selected project name.
The list of chosen insights.
The selected communication type.
All custom inputs provided by the user.
B. Edit Options:
Modify Selections:
Allow the user to go back and modify any part of the selections if needed, ensuring everything is correct before proceeding.

5. Draft Generation
A. Initiating Draft Creation
Generate Button:
The user clicks on a “Generate Communication” button.
B. AI Processing and Draft Output
Processing Inputs:
The system’s AI takes the selected insights, the custom inputs, and the template corresponding to the chosen communication type to create a first draft.
Draft Display:
The generated draft appears in a central rich text editor with clear sections (e.g., a headline, introduction, body, and conclusion).

6. Editing and Refinement
A. In-Editor Tweaks
Rich Text Editor:
The user can manually edit and refine the draft. The editor should support standard text formatting options (bold, italics, lists, headings, etc.).
Re-generate Options:
Provide buttons to “Regenerate” specific sections if the user wants an alternative version for part of the communication.
Inline Annotations:
Optionally, allow inline comments or annotations for collaborative review or personal notes.
B. Version Control
Save Draft Versions:
Enable the user to save multiple versions or revert to an earlier draft if needed, ensuring they can track changes over time.

7. Finalisation and Saving
A. Final Preview
Display Final Layout:
A preview mode shows the communication as it would be received (e.g., an email layout, poster design, or script format).
B. Save or Export
Saving Options:
The user can save the final version to the project’s communications repository.
Options to export the communication (e.g., as a PDF, HTML, or directly send via email) should also be available.
C. Confirmation Screen:
Summary & Next Steps:
After saving, a confirmation screen summarises the saved communication and offers options to create another or return to the project dashboard.