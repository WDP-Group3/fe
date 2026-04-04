import { useState, useCallback, useRef } from 'react';
import apiClient from '../services/apiClient';
import config from '../config';

/**
 * Hook cho signed Cloudinary upload.
 *
 * Luồng:
 *  1. Frontend gọi GET /api/uploads/sign → lấy signed params
 *  2. Frontend upload trực tiếp lên Cloudinary với signed params
 *  3. Cloudinary trả về secure_url → frontend gửi URL lên backend
 *
 * @param {{ folder?: string }} options
 * @returns {{ upload: (file: File) => Promise<string>, uploading: boolean, error: string|null, progress: number }}
 */
export const useCloudinaryUpload = (options = {}) => {
  const { folder = 'documents' } = options;
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const abortRef = useRef(null);

  const upload = useCallback(async (file) => {
    if (!file) throw new Error('Không có file để upload');

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      // Bước 1: Lấy signed params từ backend
      const signRes = await apiClient.post('/uploads/sign', {
        filename: file.name,
        filetype: file.type,
        folder,
      });

      if (signRes.status !== 'success' || !signRes.data) {
        throw new Error(signRes.message || 'Không lấy được signed params từ server');
      }

      const { signature, timestamp, apiKey, cloudName } = signRes.data;

      // Bước 2: Upload lên Cloudinary với signed params
      const form = new FormData();
      form.append('file', file);
      form.append('signature', signature);
      form.append('timestamp', timestamp);
      form.append('api_key', apiKey);
      form.append('upload_preset', 'drivecenter_signed');
      form.append('folder', folder);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
        {
          method: 'POST',
          body: form,
        }
      );

      const uploadData = await uploadRes.json();

      if (!uploadRes.ok || uploadData.error) {
        throw new Error(uploadData.error?.message || 'Upload lên Cloudinary thất bại');
      }

      setProgress(100);

      if (!uploadData.secure_url) {
        throw new Error('Cloudinary không trả về secure_url');
      }

      return uploadData.secure_url;
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Upload thất bại';
      setError(msg);
      throw new Error(msg);
    } finally {
      setUploading(false);
    }
  }, [folder]);

  const reset = useCallback(() => {
    setUploading(false);
    setError(null);
    setProgress(0);
  }, []);

  return { upload, uploading, error, progress, reset };
};
