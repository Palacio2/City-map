import React, { useState, useEffect } from 'react';
import { supabase } from '@supabaseClient';
import { FaCamera, FaSpinner } from 'react-icons/fa';
import styles from './AvatarUpload.module.css';

export default function AvatarUpload({ uid, url, onUpload }) {
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (url) downloadImage(url);
  }, [url]);

  const downloadImage = async (path) => {
    try {
      const { data, error } = await supabase.storage.from('avatars').download(path);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      setAvatarUrl(url);
    } catch (error) {
      console.log('Error downloading image: ', error.message);
    }
  };

  const uploadAvatar = async (event) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${uid}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: filePath }
      });

      if (updateError) throw updateError;

      onUpload(filePath);
    } catch (error) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.avatarContainer}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt="Avatar"
          className={styles.avatarImage}
        />
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