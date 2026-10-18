import { FaCamera, FaSpinner } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useAvatarUpload } from '../hooks/useAvatarUpload';
import type { AvatarUploadProps } from '../types';

export const AvatarUpload = ({ uid, url, onUpload }: AvatarUploadProps) => {
  const { t } = useTranslation('db');
  const { signedUrl, isProcessing, error, handleFileChange } = useAvatarUpload(uid, url, onUpload);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-[70px] h-[70px] rounded-full overflow-hidden border-2 border-borderClient bg-surface shrink-0 group">
        {signedUrl && !isProcessing ? (
          <img src={signedUrl} alt={t('profile.labels.avatar')} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-body text-textSecondary text-2xl">
            {isProcessing ? <FaSpinner className="animate-spin" /> : <FaCamera />}
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 transition-opacity duration-200 cursor-pointer group-hover:opacity-100">
          <label className="text-white text-xl cursor-pointer w-full h-full flex items-center justify-center" htmlFor="avatar-upload-input">
            {isProcessing ? '...' : <FaCamera />}
          </label>
          <input
            className="hidden"
            type="file"
            id="avatar-upload-input"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isProcessing}
          />
        </div>
      </div>
      {error && (
        <span className="text-danger text-xs text-center max-w-[120px] leading-tight">
          {error}
        </span>
      )}
    </div>
  );
};