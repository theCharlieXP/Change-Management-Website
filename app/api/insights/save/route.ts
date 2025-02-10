import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs'

export async function POST(request: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { title, url, summary, additional_notes, projectId } = await request.json()

    // Verify that the project belongs to the user
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or unauthorized' },
        { status: 404 }
      )
    }

    const savedInsight = await prisma.savedInsight.create({
      data: {
        title,
        url,
        summary,
        additional_notes,
        projectId
      }
    })

    return NextResponse.json(savedInsight)
  } catch (error) {
    console.error('Error saving insight:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const insightId = searchParams.get('insightId')

    if (!insightId) {
      return NextResponse.json(
        { error: 'Insight ID is required' },
        { status: 400 }
      )
    }

    // First verify that the insight belongs to a project owned by the user
    const insight = await prisma.savedInsight.findFirst({
      where: {
        id: insightId
      },
      include: {
        project: true
      }
    })

    if (!insight) {
      return NextResponse.json(
        { error: 'Insight not found' },
        { status: 404 }
      )
    }

    // Verify that the project belongs to the user
    if (insight.project.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await prisma.savedInsight.delete({
      where: {
        id: insightId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing saved insight:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
} 