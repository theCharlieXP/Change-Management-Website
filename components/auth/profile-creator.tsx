'use client';

import { useEffect, useCallback, useState } from 'react';
import { useAuth, useSession } from '@clerk/nextjs';

export function ProfileCreator() {
  const { userId, isLoaded, isSignedIn } = useAuth();
  const { session, isLoaded: isSessionLoaded } = useSession();
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  const createProfile = useCallback(async () => {
    if (!isLoaded || !isSessionLoaded) {
      console.log('ProfileCreator: Auth or session not loaded yet', {
        isAuthLoaded: isLoaded,
        isSessionLoaded: isSessionLoaded,
        currentPathname: typeof window !== 'undefined' ? window.location.pathname : 'server-side'
      });
      return false;
    }

    if (!isSignedIn || !userId || !session) {
      console.log('ProfileCreator: Not signed in or missing data:', { 
        isSignedIn, 
        userId, 
        hasSession: !!session,
        currentPathname: typeof window !== 'undefined' ? window.location.pathname : 'server-side'
      });
      return false;
    }

    console.log('ProfileCreator: Attempting to create/fetch profile for user:', userId);
    
    try {
      // Get the session token
      let sessionToken;
      try {
        sessionToken = await session.getToken();
        if (!sessionToken) {
          console.log('ProfileCreator: No session token available yet');
          return false;
        }
      } catch (tokenError) {
        console.error('ProfileCreator: Error getting session token:', tokenError);
        return false;
      }

      console.log('ProfileCreator: Got session token, making request');
      try {
        const response = await fetch('/api/auth/profile', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}`,
            'x-user-id': userId.toLowerCase(),
            'x-session-id': session.id
          },
          cache: 'no-store'
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
          console.log('ProfileCreator: Error response:', {
            status: response.status,
            statusText: response.statusText,
            data,
            currentPathname: typeof window !== 'undefined' ? window.location.pathname : 'server-side'
          });
          return false;
        }

        const profile = await response.json();
        console.log('ProfileCreator: Profile created/fetched successfully:', profile);
        return true;
      } catch (fetchError) {
        console.error('ProfileCreator: Fetch error:', {
          error: fetchError,
          message: fetchError instanceof Error ? fetchError.message : 'Unknown error',
          stack: fetchError instanceof Error ? fetchError.stack : undefined,
          currentPathname: typeof window !== 'undefined' ? window.location.pathname : 'server-side'
        });
        return false;
      }
    } catch (error) {
      console.error('ProfileCreator: Error creating/fetching profile:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        currentPathname: typeof window !== 'undefined' ? window.location.pathname : 'server-side'
      });
      return false;
    }
  }, [isLoaded, isSignedIn, userId, session, isSessionLoaded]);

  useEffect(() => {
    const attemptProfileCreation = async () => {
      if (retryCount >= MAX_RETRIES) {
        console.log('ProfileCreator: Max retries reached', {
          retryCount,
          currentPathname: typeof window !== 'undefined' ? window.location.pathname : 'server-side'
        });
        return;
      }

      const success = await createProfile();
      
      // IMPORTANT: Don't retry for project detail pages to avoid potential redirects
      const isProjectPage = typeof window !== 'undefined' && window.location.pathname.includes('/projects/');
      
      if (!success && isSignedIn && !isProjectPage) {
        console.log('ProfileCreator: Auth not ready yet, will retry in 3 seconds', {
          retryCount: retryCount + 1,
          currentPathname: typeof window !== 'undefined' ? window.location.pathname : 'server-side'
        });
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, 3000);
      }
    };

    // Only attempt to create a profile when user is signed in
    if (isSignedIn && userId) {
      console.log('ProfileCreator: User is signed in, attempting profile creation', {
        userId,
        retryCount,
        currentPathname: typeof window !== 'undefined' ? window.location.pathname : 'server-side'
      });
      attemptProfileCreation();
    }
  }, [createProfile, retryCount, isSignedIn, userId]);

  // This component doesn&apos;t render anything
  return null;
} 