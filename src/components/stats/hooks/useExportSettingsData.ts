import { useQuery } from '@tanstack/react-query';
import { supabase } from '@supabaseClient';

export interface ExportSettingsData {
  agencyName: string;
  phone: string;
  logoUrl: string | null;
}

export const useExportSettingsData = (isOpen: boolean) => {
  return useQuery<ExportSettingsData>({
    queryKey: ['exportSettingsData'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const meta = user?.user_metadata || {};
      
      let logoUrl = null;
      if (meta.avatar_url) {
        const { data } = await supabase.storage.from('avatars').createSignedUrl(meta.avatar_url, 3600);
        logoUrl = data?.signedUrl || null;
      }
      
      return {
        agencyName: meta.full_name || '',
        phone: meta.phone || '',
        logoUrl
      };
    },
    enabled: isOpen,
    staleTime: 60 * 60 * 1000 // 1 hour
  });
};
