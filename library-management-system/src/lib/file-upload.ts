import { toast } from 'sonner';

interface UploadResponse {
  url: string;
  error?: string;
}

export async function uploadFile(file: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const data: UploadResponse = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Upload failed');
    }

    return data.url;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    toast.error(message);
    throw error;
  }
}

export function validateFile(file: File, options: {
  maxSize?: number;
  allowedTypes?: string[];
} = {}): string | null {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif'],
  } = options;

  if (file.size > maxSize) {
    return `File size must be less than ${maxSize / 1024 / 1024}MB`;
  }

  if (!allowedTypes.includes(file.type)) {
    return `File type must be one of: ${allowedTypes.join(', ')}`;
  }

  return null;
} 