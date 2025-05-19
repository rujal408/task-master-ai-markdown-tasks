export type FileType = 'image' | 'document' | 'other';

export type UploadFileType = {
  name: string;
  size: number;
  type: string;
  url: string;
  uploadPath: string;
};

export type UploadResult = {
  success: boolean;
  file?: UploadFileType;
  error?: string;
};

export type FileUploadContextType = {
  uploading: boolean;
  progress: number;
  uploadFile: (file: File, type: string, entityId?: string) => Promise<UploadResult>;
  deleteFile: (filePath: string) => Promise<boolean>;
};

export type UploadConfig = {
  maxSize: number; // in bytes
  allowedTypes: string[];
  destination: string;
};

export const uploadConfigs: Record<string, UploadConfig> = {
  bookCover: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    destination: 'books',
  },
  profilePicture: {
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    destination: 'profiles',
  },
};
