'use client';

import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';

export function ProfileCreator() {
  const { userId, isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    const createProfile = async () => {
      if (isLoaded && isSignedIn && userId) {
        console.log('ProfileCreator: Attempting to create/fetch profile for user:', userId);
        
        try {
          const response = await fetch('/api/auth/profile', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          const text = await response.text();
          console.log('ProfileCreator: Raw response:', text);

          try {
            const data = JSON.parse(text);
            console.log('ProfileCreator: Parsed response:', data);

            // If we get an error related to RLS or authentication, retry after a short delay
            if (data.error && (
              data.details?.code === '42501' || // RLS violation
              data.details?.code === '401' ||   // Unauthorized
              data.error === 'Database connection error'
            )) {
              console.log('ProfileCreator: Got error, will retry in 2 seconds:', data.error);
              setTimeout(createProfile, 2000);
            }
          } catch (e) {
            console.error('ProfileCreator: Error parsing response:', e);
          }
        } catch (error) {
          console.error('ProfileCreator: Error creating profile:', error);
          // Retry on network errors
          setTimeout(createProfile, 2000);
        }
      } else {
        console.log('ProfileCreator: Not ready or not signed in:', { isLoaded, isSignedIn, userId });
      }
    };

    createProfile();
  }, [isLoaded, isSignedIn, userId]);

  // This component doesn't render anything
  return null;
} 