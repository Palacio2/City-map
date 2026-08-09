import { useQuery } from '@tanstack/react-query';
import { getProfile } from '../api/profileApi';
import type { UserProfile } from '../types';

export const useProfile = () => {
  const { data: profile, isLoading, isError } = useQuery<UserProfile>({
    queryKey: ['userProfile'],
    queryFn: getProfile,
    staleTime: 5 * 60 * 1000,
  });

  return {
    profile,
    isLoading,
    isError
  };
};