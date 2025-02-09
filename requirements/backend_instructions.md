# Project overview
Use this guide to build backend for the web app of change buddy.

# Tech stack
We will use Next.js, Shadcn, Supabase, Deepseek, Tavily, Vercel, Clerk.



CREATE TABLE profiles (
    user_id INT8 PRIMARY KEY,
    tier TEXT,
    credits NUMERIC,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

create table if not exists project_status (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  status project_status_enum not null,
  note text,                      -- optional comment about the status change
  created_at timestamptz default now()
);

create table tasks (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  description text not null,
  status text default 'pending',
  due_date date,
  created_at timestamptz default now()
);

create table if not exists saved_insights (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,          -- e.g. the title of the result card
  url text,                     -- the link to the source or result
  summary text not null,        -- the automatically generated summary
  additional_notes text,        -- user-provided notes about the insight
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists saved_summaries (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,           -- title or headline of the summary
  summary text not null,         -- the summarised content
  additional_notes text,         -- any extra notes provided by the user
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists notes (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  content text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

# Requirements
1. Create user to user table
   1. After a user signs in, we should get a userId from clerk, and check if this userId exist in 'profiles' table, matching "user_id".
   2. if the user does not exist, create a new row in 'profiles' table
   3. if the user does exist already, then proceed, and pass on user_id to functions like creating a project.
2. Dashboard Access & Structure
   1. Once authenticated, users are taken to a dashboard that is divided into two main sections: Projects and Insights.
   2. The dashboard should have a clean and user-friendly layout, with a navigation area that allows the user to switch between the Projects and Insights sections.
3. Projects Section Requirements
   1. Project Creation:
      - Provide an option for users to create a new project.
      - When creating a project, the user should be prompted to enter a project title.
      - The project should be associated with the authenticated user's user_id.
   2. Project Overview:
      - Display a grid of all projects created by the user.
      - Each project item should show the project title and a timestamp of creation.
   3. Project Detail Page:
      - When a project is selected, open a dedicated project page.
      - This page should display the project’s details (title, creation date, and an option to edit project information).
4. Storing Project Data:
  - Tasks: Allow users to add, edit, and delete tasks related to the project. Tasks might include actionable items such as “Review insights” or “Plan meeting agenda.”
  - Notes: Provide an area where users can add freeform notes or annotations specific to the project.
  - Saved Insights:
    - Integrate with the Insights section so that when a user is viewing results on the Insights page, they can click a “Save to Project” option.
    - When saving, the selected insight (including its title, summary, source, etc.) and any associated notes entered in the Insights view should be stored under the selected project.
  - Insight Summaries: Similarly, allow users to generate a summary of insights from the Insights page and save this summary to the project. The summary should include the bullet-point overview along with any user-added notes.
