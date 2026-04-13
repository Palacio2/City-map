import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';

interface BannerData {
  message: string;
  type: string;
  is_active: boolean;
}

export default function GlobalBanner() {
  const [banner, setBanner] = useState<BannerData | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchBanner = async () => {
      try {
        const { data, error } = await supabase
          .from('global_notifications')
          .select('*')
          .eq('is_active', true)
          .maybeSingle();

        if (isMounted) {
          if (!error && data) {
            setBanner(data as BannerData);
          } else {
            setBanner(null);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch global banner:', err);
      }
    };

    fetchBanner();

    const channel = supabase
      .channel('public:global_notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'global_notifications' }, () => {
        fetchBanner();
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  if (!banner) return null;

  const bgColors: Record<string, string> = {
    info: 'bg-blue-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error: 'bg-red-500'
  };

  const currentBg = bgColors[banner.type] || bgColors.info;

  return (
    <div className={`w-full py-2.5 px-4 text-center font-semibold text-sm text-white shadow-md relative z-[1001] animate-fadeIn flex items-center justify-center ${currentBg}`}>
      <span className="tracking-wide">{banner.message}</span>
    </div>
  );
}