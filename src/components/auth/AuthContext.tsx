import React, { createContext, useContext, useEffect, useMemo, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@supabaseClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const queryClient = useQueryClient();

  const { data: session, isLoading } = useQuery({
    queryKey: ['authUser'],
    queryFn: async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    },
    staleTime: Infinity,
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        queryClient.invalidateQueries({ queryKey: ['authUser'] });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  const signOut = async (): Promise<void> => {
    await supabase.auth.signOut();
    queryClient.invalidateQueries({ queryKey: ['authUser'] });
  };

  const user = session?.user || null;

  const value = useMemo(() => ({
    session: session || null,
    user,
    isAuthenticated: !!session,
    isLoading,
    signOut
  }), [session, user, isLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};