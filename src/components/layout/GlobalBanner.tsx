import { useGlobalBanner } from './hooks/useGlobalBanner';

export default function GlobalBanner() {
  const { banner } = useGlobalBanner();

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