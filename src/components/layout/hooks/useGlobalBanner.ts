import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@supabaseClient';

export interface BannerData {
  message: string;
  type: string;
  is_active: boolean;
}

export const useGlobalBanner = () => {
  const queryClient = useQueryClient();

  const { data: banner } = useQuery({
    queryKey: ['globalBanner'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('global_notifications')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();
      
      if (error) throw error;
      return (data as BannerData) || null;
    },
    staleTime: Infinity,
  });

  useEffect(() => {
    const channel = supabase
      .channel('public:global_notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'global_notifications' }, () => {
        queryClient.invalidateQueries({ queryKey: ['globalBanner'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return { banner };
};