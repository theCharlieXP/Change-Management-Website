import { auth } from '@clerk/nextjs'

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  try {
    // Get the session token
    const { getToken } = auth()
    const token = await getToken()

    if (!token) {
      throw new Error('Not authenticated')
    }

    // Add authorization header
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }

    // Make the request
    const response = await fetch(url, {
      ...options,
      headers,
    })

    // Check if unauthorized
    if (response.status === 401) {
      throw new Error('Unauthorized')
    }

    return response
  } catch (error) {
    console.error('Fetch error:', error)
    throw error
  }
} 