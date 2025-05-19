import React, { createContext, useContext, useState, ReactNode } from 'react';
import { FileUploadContextType, UploadFileType, UploadResult } from '@/types/file-upload';

// Create context with default values
const FileUploadContext = createContext<FileUploadContextType>({
  uploading: false,
  progress: 0,
  uploadFile: async () => ({ success: false, error: 'Not implemented' }),
  deleteFile: async () => false,
});

// Hook to use the context
export const useFileUpload = () => useContext(FileUploadContext);

type FileUploadProviderProps = {
  children: ReactNode;
};

export function FileUploadProvider({ children }: FileUploadProviderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  /**
   * Upload a file to the server
   */
  const uploadFile = async (
    file: File,
    type: string,
    entityId?: string
  ): Promise<UploadResult> => {
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    setUploading(true);
    setProgress(10);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('type', type);
      if (entityId) {
        queryParams.append('entityId', entityId);
      }

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 5, 85));
      }, 100);

      const response = await fetch(`/api/upload?${queryParams.toString()}`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(90);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      setProgress(100);
      
      return { success: true, file: data.file };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      return { success: false, error: errorMessage };
    } finally {
      // Reset progress after a delay for better UX
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
      }, 500);
    }
  };

  /**
   * Delete a file from the server
   */
  const deleteFile = async (filePath: string): Promise<boolean> => {
    if (!filePath) {
      return false;
    }

    try {
      const response = await fetch(`/api/files/${encodeURIComponent(filePath)}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Deletion failed');
      }

      return true;
    } catch (error) {
      console.error('File deletion error:', error);
      return false;
    }
  };

  const value: FileUploadContextType = {
    uploading,
    progress,
    uploadFile,
    deleteFile,
  };

  return (
    <FileUploadContext.Provider value={value}>
      {children}
    </FileUploadContext.Provider>
  );
}
