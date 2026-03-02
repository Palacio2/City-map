import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaCamera, FaSpinner } from 'react-icons/fa';
import { storageApi } from '@api/storageApi';
import styles from './AvatarUpload.module.css';

const avatarCache = {};

export default function AvatarUpload({ uid, url: filePath, onUpload }) {
  const { t } = useTranslation('profile');
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
      console.error(t('edit_page.errors.avatar_load_error'));
    }
  };

  const uploadAvatar = async (event) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error(t('edit_page.errors.select_image'));
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
    <div className={styles.avatarContainer}>
      {signedUrl ? (
        <img src={signedUrl} alt="Avatar" className={styles.avatarImage} />
      ) : (
        <div className={styles.avatarPlaceholder}>
          {uploading ? <FaSpinner className={styles.spinner} /> : <FaCamera />}
        </div>
      )}
      
      <div className={styles.uploadOverlay}>
        <label className={styles.uploadLabel} htmlFor="single">
          {uploading ? '...' : <FaCamera />}
        </label>
        <input
          style={{ visibility: 'hidden', position: 'absolute' }}
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