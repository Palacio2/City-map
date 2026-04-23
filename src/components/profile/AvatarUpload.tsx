import { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { FaCamera, FaSpinner } from 'react-icons/fa';
import { useQuery, useMutation } from '@tanstack/react-query';
import { storageApi } from '@api/storageApi';

interface AvatarUploadProps {
  uid: string | null;
  url: string | null;
  onUpload: (url: string) => void;
}

export default function AvatarUpload({ uid, url: filePath, onUpload }: AvatarUploadProps) {
  const { t } = useTranslation('db');

  const { data: signedUrl, isLoading: isLoadingUrl } = useQuery({
    queryKey: ['avatar', filePath],
    queryFn: () => filePath ? storageApi.getSignedUrl('avatars', filePath) : null,
    enabled: !!filePath,
    staleTime: 1000 * 60 * 60, 
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!uid) throw new Error('UID is missing');
      const fileExt = file.name.split('.').pop();
      const newFilePath = `${uid}/${Date.now()}.${fileExt}`;

      if (filePath) {
        await storageApi.removeFile('avatars', filePath).catch(() => {});
      }

      await storageApi.uploadFile('avatars', newFilePath, file);
      await storageApi.updateUserAvatar(newFilePath);
      return newFilePath;
    },
    onSuccess: (newPath) => onUpload(newPath),
    onError: (error: Error) => alert(error.message || t('profile.edit_page.errors.avatar_load_error'))
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      uploadMutation.mutate(event.target.files[0]);
    }
  };

  const isProcessing = uploadMutation.isPending || isLoadingUrl;

  return (
    <div className="relative w-[70px] h-[70px] rounded-full overflow-hidden border-2 border-borderClient bg-surface shrink-0 group">
      {signedUrl && !isProcessing ? (
        <img src={signedUrl} alt={t('profile.labels.avatar')} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-body text-textSecondary text-2xl">
          {isProcessing ? <FaSpinner className="animate-spin" /> : <FaCamera />}
        </div>
      )}
      
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 transition-opacity duration-200 cursor-pointer group-hover:opacity-100">
        <label className="text-white text-xl cursor-pointer w-full h-full flex items-center justify-center" htmlFor="single">
          {uploadMutation.isPending ? '...' : <FaCamera />}
        </label>
        <input
          className="invisible absolute"
          type="file"
          id="single"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploadMutation.isPending}
        />
      </div>
    </div>
  );
}