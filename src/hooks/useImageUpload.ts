import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useImageUpload = () => {
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (file: File, folder: string = 'general'): Promise<string | null> => {
    try {
      setUploading(true);
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('user-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error uploading image:', error);
        toast.error('Error al subir la imagen');
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('user-images')
        .getPublicUrl(data.path);

      const publicUrl = urlData.publicUrl;

      // Persist the upload record in the database (best effort, never blocks the upload)
      try {
        await supabase.from('uploaded_images').insert({
          url: publicUrl,
          path: data.path,
          folder,
          file_name: file.name,
          file_type: file.type || null,
          file_size: file.size || null,
        });
      } catch (err) {
        console.warn('uploaded_images insert failed', err);
      }

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Error al subir la imagen');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (imageUrl: string): Promise<boolean> => {
    try {
      // Extract path from URL
      const url = new URL(imageUrl);
      const path = url.pathname.split('/user-images/')[1];
      
      if (!path) return false;

      const { error } = await supabase.storage
        .from('user-images')
        .remove([path]);

      if (error) {
        console.error('Error deleting image:', error);
        return false;
      }

      // Remove the persisted record from the database (best effort)
      try {
        await supabase.from('uploaded_images').delete().eq('path', path);
      } catch (err) {
        console.warn('uploaded_images delete failed', err);
      }

      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  };

  return { uploadImage, deleteImage, uploading };
};
