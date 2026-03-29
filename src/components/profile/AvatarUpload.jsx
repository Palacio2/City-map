import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaCamera, FaSpinner } from 'react-icons/fa';
import { storageApi } from '@api/storageApi';

const avatarCache = {};

export default function AvatarUpload({ uid, url: filePath, onUpload }) {
  const { t } = useTranslation('db');
  const [signedUrl, setSignedUrl] = useState(avatarCache[filePath] || null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (filePath) {
      if (avatarCache[filePath]) {
        setSignedUrl(avatarCache[filePath]);
      } else {
        fetchSignedUrl(filePath);
      }
    }
  }, [filePath]);

  const fetchSignedUrl = async (path) => {
    try {
      const url = await storageApi.getSignedUrl('avatars', path);
      avatarCache[path] = url;
      setSignedUrl(url);
    } catch {
      console.error(t('profile.edit_page.errors.avatar_load_error'));
    }
  };

  const uploadAvatar = async (event) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error(t('profile.edit_page.errors.select_image'));
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const newFilePath = `${uid}/${Date.now()}.${fileExt}`;

      if (filePath) {
        await storageApi.removeFile('avatars', filePath).catch(() => {});
        delete avatarCache[filePath];
      }

      await storageApi.uploadFile('avatars', newFilePath, file);
      await storageApi.updateUserAvatar(newFilePath);

      onUpload(newFilePath);
    } catch (error) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative w-[70px] h-[70px] rounded-full overflow-hidden border-2 border-borderClient bg-surface shrink-0 group">
      {signedUrl ? (
        <img src={signedUrl} alt="Avatar" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-body text-textSecondary text-2xl">
          {uploading ? <FaSpinner className="animate-spin" /> : <FaCamera />}
        </div>
      )}
      
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 transition-opacity duration-200 cursor-pointer group-hover:opacity-100">
        <label className="text-white text-xl cursor-pointer w-full h-full flex items-center justify-center" htmlFor="single">
          {uploading ? '...' : <FaCamera />}
        </label>
        <input
          className="invisible absolute"
          type="file"
          id="single"
          accept="image/*"
          onChange={uploadAvatar}
          disabled={uploading}
        />
      </div>
    </div>
  );
}