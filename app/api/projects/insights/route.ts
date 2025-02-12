import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { createClient } from '@supabase/supabase-js'
import type { InsightFocusArea } from '@/types/insights'

// Add environment variable validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:', {
    hasUrl: !!supabaseUrl,
    hasServiceKey: !!supabaseServiceKey
  })
  throw new Error('Missing required Supabase environment variables')
}

// Create a Supabase client with the service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
})

// Valid focus areas for validation
const VALID_FOCUS_AREAS: Record<InsightFocusArea, true> = {
  'challenges-barriers': true,
  'strategies-solutions': true,
  'outcomes-results': true,
  'key-stakeholders-roles': true,
  'best-practices-methodologies': true,
  'lessons-learned-insights': true,
  'implementation-tactics': true,
  'communication-engagement': true,
  'metrics-performance': true,
  'risk-management': true,
  'technology-tools': true,
  'cultural-transformation': true,
  'change-leadership': true,
  'employee-training': true,
  'change-sustainability': true
}

export async function POST(request: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    console.log('Request body:', {
      ...body,
      insight: body.insight ? {
        ...body.insight,
        content: body.insight.content ? 'CONTENT_EXISTS' : 'NO_CONTENT'
      } : 'NO_INSIGHT'
    })

    const { project_id, insight } = body

    if (!project_id || !insight) {
      console.error('Missing required fields:', { project_id, hasInsight: !!insight })
      return new NextResponse(
        JSON.stringify({ 
          error: 'Missing required fields',
          details: 'Both project_id and insight are required'
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate focus area
    if (!insight.focus_area || !VALID_FOCUS_AREAS[insight.focus_area as InsightFocusArea]) {
      console.error('Invalid focus area:', insight.focus_area)
      return new NextResponse(
        JSON.stringify({ 
          error: 'Invalid focus area',
          details: 'The focus area provided is not valid',
          providedValue: insight.focus_area,
          validValues: Object.keys(VALID_FOCUS_AREAS)
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // First verify project exists and belongs to user
    console.log('Verifying project ownership:', { project_id, userId })
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', project_id)
      .eq('user_id', userId)
      .single()

    if (projectError) {
      console.error('Project verification error:', {
        code: projectError.code,
        message: projectError.message,
        details: projectError.details,
        hint: projectError.hint
      })
      
      if (projectError.code === 'PGRST116') {
        return new NextResponse(
          JSON.stringify({ 
            error: 'Project not found',
            details: 'Project does not exist or you do not have access to it'
          }),
          { 
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
      
      throw projectError
    }

    // Check if insight is already saved
    console.log('Checking for existing insight:', { project_id, insightId: insight.id })
    const { data: existingInsight, error: checkError } = await supabase
      .from('saved_insights')
      .select('id')
      .eq('project_id', project_id)
      .eq('insight_id', insight.id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing insight:', checkError)
      throw checkError
    }

    if (existingInsight) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Insight already saved',
          details: 'This insight is already saved to this project'
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Save the insight
    console.log('Saving insight:', {
      project_id,
      insightId: insight.id,
      hasNotes: !!insight.notes,
      focus_area: insight.focus_area
    })

    const { data: savedInsight, error: saveError } = await supabase
      .from('saved_insights')
      .insert([{
        insight_id: insight.id,
        project_id: project_id,
        title: insight.title,
        url: insight.url,
        summary: insight.summary,
        focus_area: insight.focus_area,
        additional_notes: insight.notes || null,
        user_id: userId
      }])
      .select()
      .single()

    if (saveError) {
      console.error('Error saving insight:', {
        code: saveError.code,
        message: saveError.message,
        details: saveError.details,
        hint: saveError.hint
      })
      throw saveError
    }

    console.log('Successfully saved insight:', {
      id: savedInsight.id,
      project_id: savedInsight.project_id,
      insight_id: savedInsight.insight_id,
      focus_area: savedInsight.focus_area
    })

    return new NextResponse(
      JSON.stringify(savedInsight),
      { 
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Error in save insight API:', {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error,
      supabaseConfig: {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    })

    return new NextResponse(
      JSON.stringify({ 
        error: 'Failed to save insight',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
} 