'use client';

import { useEffect, useCallback } from 'react';
import { useAuth, useSession } from '@clerk/nextjs';

export function ProfileCreator() {
  const { userId, isLoaded, isSignedIn } = useAuth();
  const { session, isLoaded: isSessionLoaded } = useSession();

  const createProfile = useCallback(async () => {
    if (!isLoaded || !isSessionLoaded) {
      console.log('ProfileCreator: Auth or session not loaded yet');
      return;
    }

    if (!isSignedIn || !userId || !session) {
      console.log('ProfileCreator: Not signed in or missing data:', { 
        isSignedIn, 
        userId, 
        hasSession: !!session 
      });
      return;
    }

    console.log('ProfileCreator: Attempting to create/fetch profile for user:', userId);
    
    try {
      // Get the session token
      const sessionToken = await session.getToken({
        template: 'supabase'
      });

      if (!sessionToken) {
        console.log('ProfileCreator: No session token available yet');
        return;
      }

      console.log('ProfileCreator: Got session token, making request');
      const response = await fetch('/api/auth/profile', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
          'X-User-Id': userId
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('ProfileCreator: HTTP error:', response.status, response.statusText);
        console.log('ProfileCreator: Error data:', errorData);
        
        if (response.status === 401) {
          // If unauthorized, wait longer before retrying to allow auth to fully initialize
          console.log('ProfileCreator: Auth not ready yet, will retry in 3 seconds');
          setTimeout(createProfile, 3000);
          return;
        }

        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('ProfileCreator: Success:', data);
      
    } catch (error) {
      console.error('ProfileCreator: Error creating profile:', error);
      if (error instanceof Error) {
        console.error('ProfileCreator: Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
      // Retry on network errors after a delay
      setTimeout(createProfile, 2000);
    }
  }, [isLoaded, isSessionLoaded, isSignedIn, userId, session]);

  useEffect(() => {
    if (!isLoaded || !isSessionLoaded) {
      return;
    }

    // Add a delay before the first attempt to ensure auth is properly initialized
    if (isSignedIn && userId && session) {
      const timer = setTimeout(() => {
        console.log('ProfileCreator: Starting profile creation/fetch after initial delay');
        createProfile();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [createProfile, isSignedIn, userId, session, isLoaded, isSessionLoaded]);

  // This component doesn't render anything
  return null;
} 