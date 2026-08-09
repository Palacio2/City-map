import { createContext, useContext, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@supabaseClient';
import type { AuthContextType } from '../types';
import { AuthContextSchema } from '../validation';

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  readonly children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const queryClient = useQueryClient();

  const { data: session, isLoading } = useQuery({
    queryKey: ['authUser'],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session;
    },
    staleTime: Infinity,
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        queryClient.invalidateQueries({ queryKey: ['authUser'] });
      }
    });
    return () => subscription.unsubscribe();
  }, [queryClient]);

  const signOut = async (): Promise<void> => {
    await supabase.auth.signOut();
    queryClient.setQueryData(['authUser'], null);
  };

  const value = useMemo<AuthContextType>(() => ({
    session: session || null,
    user: session?.user || null,
    isAuthenticated: !!session,
    isLoading,
    signOut
  }), [session, isLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  return AuthContextSchema.parse(ctx);
};