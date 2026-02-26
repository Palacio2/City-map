import React, { useState, useEffect } from 'react';
import { supabase } from '@supabaseClient';
import { FaCamera, FaSpinner } from 'react-icons/fa';
import styles from './AvatarUpload.module.css';

export default function AvatarUpload({ uid, url: filePath, onUpload }) {
  const [signedUrl, setSignedUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Отримуємо тимчасове посилання, коли є шлях до файлу
  useEffect(() => {
    if (filePath) {
      getSignedUrl(filePath);
    }
  }, [filePath]);

  const getSignedUrl = async (path) => {
    try {
      // Створюємо посилання, яке діятиме 1 годину (3600 секунд)
      const { data, error } = await supabase.storage
        .from('avatars')
        .createSignedUrl(path, 3600);

      if (error) throw error;
      setSignedUrl(data.signedUrl);
    } catch (error) {
      console.error('Помилка отримання зображення: ', error.message);
    }
  };

  const uploadAvatar = async (event) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Оберіть зображення для завантаження.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      // Генеруємо новий шлях: id_користувача/timestamp.розширення
      const newFilePath = `${uid}/${Date.now()}.${fileExt}`;

      // 1. Видаляємо старе фото зі Storage (якщо воно було)
      if (filePath) {
        await supabase.storage.from('avatars').remove([filePath]);
      }

      // 2. Завантажуємо нове фото
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(newFilePath, file);

      if (uploadError) throw uploadError;

      // 3. Оновлюємо шлях в метаданих користувача
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: newFilePath }
      });

      if (updateError) throw updateError;

      // 4. Повідомляємо батьківський компонент про новий шлях
      onUpload(newFilePath);
    } catch (error) {
      alert('Помилка завантаження: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.avatarContainer}>
      {signedUrl ? (
        <img
          src={signedUrl}
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