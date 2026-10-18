import { useTranslation } from 'react-i18next';
import { AvatarUpload } from './AvatarUpload';
import type { ProfileHeaderProps } from '../types';
import { FaEnvelope, FaPhoneAlt } from 'react-icons/fa';

export const ProfileHeader = ({ profile }: ProfileHeaderProps) => {
  const { t } = useTranslation('db');

  return (
    <div className="bg-surface rounded-[2rem] shadow-xs border border-borderClient overflow-hidden flex flex-col items-center relative">
      {/* Banner / Cover area */}
      <div className="w-full h-28 sm:h-36 relative overflow-hidden">
        <style>{`
          @keyframes aurora-shift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .animate-aurora {
            background: linear-gradient(-45deg, #3b82f6, #8b5cf6, var(--accent-color), #06b6d4);
            background-size: 400% 400%;
            animation: aurora-shift 12s ease infinite;
          }
        `}</style>
        <div className="absolute inset-0 animate-aurora opacity-90 dark:opacity-70" />
        <div className="absolute inset-0 bg-black/10 dark:bg-black/30 mix-blend-overlay" />
        
        {/* Subtle Map/City Grid over Banner */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      {/* Avatar (overlapping banner) */}
      <div className="relative -mt-14 sm:-mt-16 mb-4 z-10">
        <div className="relative rounded-full p-1.5 bg-surface shadow-md">
          <AvatarUpload 
            uid={profile.id} 
            url={profile.avatar_url} 
            onUpload={() => {}} 
          />
        </div>
      </div>

      {/* User Info */}
      <div className="flex flex-col items-center w-full px-6 pb-8 text-center relative z-10">
        <div className="text-2xl sm:text-3xl font-bold font-sans text-textMain m-0 tracking-tight mb-4">
          {profile.full_name || t('profile.labels.full_name')}
        </div>
        
        <div className="flex flex-wrap items-center justify-center gap-3 text-textSecondary text-[0.9rem] font-medium">
          <div className="flex items-center gap-2 px-4 py-1.5 bg-body rounded-full border border-borderClient">
            <FaEnvelope className="text-textSecondary/60" />
            <span>{profile.email}</span>
          </div>
          {profile.phone && (
            <div className="flex items-center gap-2 px-4 py-1.5 bg-body rounded-full border border-borderClient">
              <FaPhoneAlt className="text-textSecondary/60" />
              <span>{profile.phone}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};