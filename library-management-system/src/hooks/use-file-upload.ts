import { useState, useCallback } from 'react';
import { uploadFile, validateFile } from '@/lib/file-upload';

interface UseFileUploadOptions {
  maxSize?: number;
  allowedTypes?: string[];
  onSuccess?: (url: string) => void;
  onError?: (error: Error) => void;
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = useCallback(
    async (file: File) => {
      setError(null);
      setIsUploading(true);

      try {
        // Validate file
        const validationError = validateFile(file, {
          maxSize: options.maxSize,
          allowedTypes: options.allowedTypes,
        });

        if (validationError) {
          throw new Error(validationError);
        }

        // Upload file
        const url = await uploadFile(file);
        options.onSuccess?.(url);
        return url;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed';
        setError(message);
        options.onError?.(err instanceof Error ? err : new Error(message));
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    [options]
  );

  return {
    upload: handleUpload,
    isUploading,
    error,
  };
} 