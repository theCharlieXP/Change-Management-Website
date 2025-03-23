import { NextResponse } from 'next/server'

// Set proper runtime for API compatibility
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'default-no-store'

export async function GET(request: Request) {
  try {
    console.log('AI test request received at', new Date().toISOString())
    
    // Generate a sample change management summary without any API calls
    const summary = generateHardcodedSummary()
    
    return NextResponse.json({
      success: true,
      message: 'Generated hardcoded change management summary',
      summary,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Error in ai-test route:', error)
    return NextResponse.json({
      error: 'Failed to generate sample content',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

/**
 * Generates a hardcoded change management summary that meets all requirements
 * This doesn't need any API call and will always work
 */
function generateHardcodedSummary() {
  // Create a proper summary with:
  // 1. Title with first letter of each word capitalized
  // 2. No context section
  // 3. Bullet points in the insights section
  // 4. References section
  
  return `# Change Management Best Practices

## Insights

• Effective change management requires strategic planning and stakeholder engagement to ensure successful adoption of new processes and minimize resistance among employees.

• Communication is a critical success factor in change initiatives, serving as the foundation for building trust and reducing uncertainty among affected team members.

• Organizations that establish clear metrics for measuring change progress are better positioned to make timely adjustments and demonstrate value to leadership.

• Executive sponsorship provides necessary resources and signals organizational commitment, significantly increasing the likelihood of successful change implementation.

• Building a coalition of change champions across departments creates broader ownership and accelerates adoption of new systems or processes.

• Customized training programs ensure employees have the necessary skills to operate effectively in the changed environment, reducing productivity dips.

• Post-implementation support addresses emerging challenges and reinforces new behaviors until they become organizational norms.

## References

[The Heart of Change by John P. Kotter](https://www.kotterinc.com/book/the-heart-of-change/)

[ADKAR: A Model for Change in Business, Government and our Community by Jeffrey Hiatt](https://www.prosci.com/adkar)

[Leading Change by John P. Kotter](https://www.kotterinc.com/book/leading-change/)`;
} 