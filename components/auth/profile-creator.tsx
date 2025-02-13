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
        template: 'supabase'  // Use Supabase JWT template
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
        cache: 'no-store'  // Prevent caching
      });

      const responseText = await response.text();
      console.log('ProfileCreator: Raw response:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('ProfileCreator: Error parsing response:', e);
        if (responseText.includes('<!DOCTYPE html>')) {
          console.log('ProfileCreator: Received HTML response, retrying in 2 seconds...');
          setTimeout(createProfile, 2000);
        }
        return;
      }

      if (!response.ok) {
        console.error('ProfileCreator: HTTP error:', response.status, response.statusText);
        console.log('ProfileCreator: Error data:', data);
        
        if (data.error === 'Unauthorized') {
          console.log('ProfileCreator: Unauthorized, will retry when auth is ready');
          return;
        }

        // For other errors, retry after a delay
        setTimeout(createProfile, 2000);
        return;
      }

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
      // Retry on network errors
      setTimeout(createProfile, 2000);
    }
  }, [isLoaded, isSessionLoaded, isSignedIn, userId, session]);

  useEffect(() => {
    // Add a small delay before the first attempt to allow auth to initialize
    const initialDelay = setTimeout(() => {
      createProfile();
    }, 1500);

    // Set up periodic retries while not authenticated
    const retryInterval = setInterval(() => {
      if (!isSignedIn || !userId || !session) {
        console.log('ProfileCreator: Retrying...', {
          isLoaded,
          isSessionLoaded,
          isSignedIn,
          userId: userId || 'none',
          hasSession: !!session
        });
        createProfile();
      }
    }, 2000);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(retryInterval);
    };
  }, [createProfile, isSignedIn, userId, session, isLoaded, isSessionLoaded]);

  // This component doesn't render anything
  return null;
} 