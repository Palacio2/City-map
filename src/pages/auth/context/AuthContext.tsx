/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useCallback, useState } from 'react';
import type { ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@supabaseClient';
import type { AuthContextType } from '../types';
import { prepareAccountStorage } from '../utils/accountStorage';
import { AccountQueryProvider } from './AccountQueryProvider';

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  readonly children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const queryClient = useQueryClient();
  const [accountGeneration, setAccountGeneration] = useState(0);

  const { data: session, isLoading } = useQuery({
    queryKey: ['authUser'],
    queryFn: async ({ signal }) => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        if (!signal.aborted) prepareAccountStorage(null);
        throw sessionError;
      }
      if (!sessionData.session) {
        if (!signal.aborted) prepareAccountStorage(null);
        return null;
      }

      const { error: userError } = await supabase.auth.getUser();
      if (userError) {
        if (!signal.aborted) prepareAccountStorage(null);
        throw userError;
      }

      if (!signal.aborted) prepareAccountStorage(sessionData.session.user.id);
      return sessionData.session;
    },
    staleTime: Infinity,
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      // Keep this callback synchronous; never await another Auth call inside it.
      void queryClient.cancelQueries({ queryKey: ['authUser'], exact: true });
      const previous = queryClient.getQueryData<AuthContextType['session']>(['authUser']);
      if ((previous?.user.id ?? null) !== (nextSession?.user.id ?? null)) {
        setAccountGeneration(generation => generation + 1);
      }
      prepareAccountStorage(nextSession?.user.id ?? null);
      queryClient.setQueryData(['authUser'], nextSession);
    });
    return () => subscription.unsubscribe();
  }, [queryClient]);

  const signOut = useCallback(async (): Promise<void> => {
    const startingId = queryClient.getQueryData<AuthContextType['session']>(['authUser'])?.user.id;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    const currentId = queryClient.getQueryData<AuthContextType['session']>(['authUser'])?.user.id;
    if (currentId && currentId !== startingId) return;
    prepareAccountStorage(null);
    await queryClient.cancelQueries({ queryKey: ['authUser'], exact: true });
    queryClient.setQueryData(['authUser'], null);
  }, [queryClient]);

  const value = useMemo<AuthContextType>(() => ({
    session: session || null,
    user: session?.user || null,
    isAuthenticated: !!session,
    isLoading,
    signOut
  }), [session, isLoading, signOut]);

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && <AccountQueryProvider key={`${session?.user.id ?? 'guest'}:${accountGeneration}`}>{children}</AccountQueryProvider>}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
