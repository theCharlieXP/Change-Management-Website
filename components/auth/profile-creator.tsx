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
      console.log('ProfileCreator: Auth or session not loaded yet');
      return false;
    }

    if (!isSignedIn || !userId || !session) {
      console.log('ProfileCreator: Not signed in or missing data:', { 
        isSignedIn, 
        userId, 
        hasSession: !!session 
      });
      return false;
    }

    console.log('ProfileCreator: Attempting to create/fetch profile for user:', userId);
    
    try {
      // Get the session token
      const sessionToken = await session.getToken();

      if (!sessionToken) {
        console.log('ProfileCreator: No session token available yet');
        return false;
      }

      console.log('ProfileCreator: Got session token, making request');
      const response = await fetch('/api/auth/profile', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
          'X-User-Id': userId,
          'X-Session-Id': session.id
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        const data = await response.json();
        console.log('ProfileCreator: Error response:', {
          status: response.status,
          statusText: response.statusText,
          data
        });
        return false;
      }

      const profile = await response.json();
      console.log('ProfileCreator: Profile created/fetched successfully:', profile);
      return true;
    } catch (error) {
      console.error('ProfileCreator: Error creating/fetching profile:', error);
      return false;
    }
  }, [isLoaded, isSignedIn, userId, session, isSessionLoaded]);

  useEffect(() => {
    const attemptProfileCreation = async () => {
      if (retryCount >= MAX_RETRIES) {
        console.log('ProfileCreator: Max retries reached');
        return;
      }

      const success = await createProfile();
      
      if (!success && isSignedIn) {
        console.log('ProfileCreator: Auth not ready yet, will retry in 3 seconds');
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, 3000);
      }
    };

    if (isSignedIn && userId) {
      attemptProfileCreation();
    }
  }, [createProfile, retryCount, isSignedIn, userId]);

  // This component doesn't render anything
  return null;
} 