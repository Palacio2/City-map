import { type ChangeEvent } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getSignedAvatarUrl, uploadAvatarFile, removeAvatarFile, updateUserAvatarUrl } from '../api/storageApi';
import { mapSupabaseError } from '@utils/errorHandler';

export const useAvatarUpload = (uid: string | null, filePath: string | null, onUploadSuccess: (url: string) => void) => {
  const { t } = useTranslation('db');

  const { data: signedUrl, isLoading: isLoadingUrl } = useQuery({
    queryKey: ['avatar', filePath],
    queryFn: () => filePath ? getSignedAvatarUrl(filePath) : null,
    enabled: !!filePath,
    staleTime: 1000 * 60 * 60,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!uid) throw new Error('UID is missing');
      const fileExt = file.name.split('.').pop();
      const newFilePath = `${uid}/${Date.now()}.${fileExt}`;
      
      if (filePath) {
        await removeAvatarFile(filePath).catch(() => undefined);
      }
      
      await uploadAvatarFile(newFilePath, file);
      await updateUserAvatarUrl(newFilePath);
      return newFilePath;
    },
    onSuccess: (newPath) => {
      onUploadSuccess(newPath);
    },
    onError: (error: unknown) => {
      const errorMessage = mapSupabaseError(error, t);
      alert(errorMessage || t('profile.edit_page.errors.avatar_load_error'));
    }
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      uploadMutation.mutate(event.target.files[0]);
    }
    event.target.value = '';
  };

  return {
    signedUrl,
    isProcessing: uploadMutation.isPending || isLoadingUrl,
    handleFileChange
  };
};