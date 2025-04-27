import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook that provides the auth token and loading state
 */
export function useAuth() {
  const { getToken, isLoaded, isSignedIn } = useClerkAuth();
  const [token, setToken] = useState<string | null>(null);
  const [isLoadingToken, setIsLoadingToken] = useState(true);

  const refreshToken = useCallback(async () => {
    if (isLoaded && isSignedIn) {
      setIsLoadingToken(true);
      try {
        const authToken = await getToken();
        setToken(authToken);
      } catch (error) {
        console.error('Error getting auth token:', error);
        setToken(null);
      } finally {
        setIsLoadingToken(false);
      }
    } else if (isLoaded && !isSignedIn) {
      setToken(null);
      setIsLoadingToken(false);
    }
  }, [getToken, isLoaded, isSignedIn]);

  useEffect(() => {
    refreshToken();
  }, [refreshToken]);

  return {
    token,
    isLoaded: isLoaded && !isLoadingToken,
    isSignedIn,
    refreshToken
  };
} 