import { useTranslation } from 'react-i18next';
import { AvatarUpload } from './AvatarUpload';
import type { UserProfile } from '../types';

interface ProfileHeaderProps {
  readonly profile: UserProfile;
}

export const ProfileHeader = ({ profile }: ProfileHeaderProps) => {
  const { t } = useTranslation('db');

  return (
    <div className="flex flex-col md:flex-row items-center md:items-start gap-6 bg-surface p-6 md:p-8 rounded-2xl border border-borderClient shadow-sm">
      <AvatarUpload 
        uid={profile.id} 
        url={profile.avatar_url} 
        onUpload={() => {}} 
      />
      <div className="flex flex-col items-center md:items-start text-center md:text-left">
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-textMain m-0 mb-1">
          {profile.full_name || t('profile.labels.full_name')}
        </h2>
        <div className="text-textSecondary text-base font-medium flex flex-col sm:flex-row items-center md:items-start gap-1 sm:gap-3">
          <span>{profile.email}</span>
          {profile.phone && (
            <>
              <span className="hidden sm:inline text-borderClient">•</span>
              <span>{profile.phone}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};