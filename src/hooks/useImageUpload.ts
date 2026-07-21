import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

function generateFileName(folder: string, file: File): string {
  const ext = file.name.split('.').pop();
  return `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
}

export const useImageUpload = () => {
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (file: File, folder: string = 'general'): Promise<string | null> => {
    try {
      setUploading(true);
      const fileName = generateFileName(folder, file);
      const { data, error } = await supabase.storage
        .from('user-images')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });
      if (error) { console.error('Error uploading image:', error); return null; }
      const { data: urlData } = supabase.storage.from('user-images').getPublicUrl(data.path);
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const uploadImageWithProgress = async (
    file: File,
    folder: string,
    onProgress: (percent: number) => void,
    onError: (msg: string) => void,
  ): Promise<string | null> => {
    try {
      setUploading(true);
      const fileName = generateFileName(folder, file);

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      return await new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        const url = `${SUPABASE_URL}/storage/v1/object/user-images/${fileName}`;

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(`${SUPABASE_URL}/storage/v1/object/public/user-images/${fileName}`);
          } else {
            let msg = 'Error al subir el archivo';
            try { const r = JSON.parse(xhr.responseText); msg = r.message || r.error || msg; } catch {}
            onError(msg);
            resolve(null);
          }
        };

        xhr.onerror = () => { onError('Error de conexión al subir el archivo'); resolve(null); };

        xhr.open('POST', url);
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
        xhr.send(file);
      });
    } catch (error) {
      onError('Error inesperado al subir el archivo');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (imageUrl: string): Promise<boolean> => {
    try {
      const url = new URL(imageUrl);
      const path = url.pathname.split('/user-images/')[1];
      if (!path) return false;
      const { error } = await supabase.storage.from('user-images').remove([path]);
      if (error) { console.error('Error deleting image:', error); return false; }
      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  };

  return { uploadImage, uploadImageWithProgress, deleteImage, uploading };
};
