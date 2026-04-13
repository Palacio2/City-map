export interface LoaderProps {
  size?: 'small' | 'medium' | 'large';
  fullScreen?: boolean;
  text?: string | null;
  className?: string;
}

export default function Loader({ 
  size = 'large', 
  fullScreen = false, 
  text = null,
  className = ''
}: LoaderProps) {
  const containerBase = fullScreen 
    ? "fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center gap-5 animate-fadeIn" 
    : "flex flex-col items-center justify-center gap-4 p-8 w-full h-full";

  const dimensions = {
    small: 'w-5 h-5',
    medium: 'w-12 h-12',
    large: 'w-[72px] h-[72px]',
  }[size] || 'w-12 h-12';

  const borderWidth = size === 'small' ? 'border-2' : 'border-[3px]';
  const inset = size === 'small' ? 'inset-0.5' : size === 'large' ? 'inset-1.5' : 'inset-1';

  return (
    <div className={`${containerBase} ${className}`}>
      <div className={`relative ${dimensions}`}>
        <div 
          className={`absolute inset-0 rounded-full border-transparent border-t-accent border-r-accent/30 ${borderWidth} shadow-[0_0_15px_rgba(197,164,126,0.2)] animate-[spin_1s_cubic-bezier(0.68,-0.55,0.265,1.55)_infinite]`}
        />
        <div 
          className={`absolute ${inset} rounded-full border-transparent border-b-accent border-l-accent/40 ${borderWidth} animate-[spin_1.2s_linear_infinite_reverse]`}
        />
      </div>
      
      {text && (
        <span className="text-base font-heading font-bold uppercase tracking-widest bg-clip-text text-transparent bg-[image:var(--primary-gradient)] animate-pulse">
          {text}
        </span>
      )}
    </div>
  );
}