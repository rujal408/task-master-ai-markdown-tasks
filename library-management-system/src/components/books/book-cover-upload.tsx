import { useState } from 'react';
import { FileUpload } from '@/components/ui/file-upload';
import { useFileUpload } from '@/hooks/use-file-upload';
import { Image } from '@/components/ui/image';
import { toast } from 'sonner';

interface BookCoverUploadProps {
  initialCoverUrl?: string;
  onCoverChange: (url: string) => void;
  className?: string;
}

export function BookCoverUpload({
  initialCoverUrl,
  onCoverChange,
  className,
}: BookCoverUploadProps) {
  const [coverUrl, setCoverUrl] = useState(initialCoverUrl);
  const { upload, isUploading, error } = useFileUpload({
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['image/jpeg', 'image/png'],
    onSuccess: (url) => {
      setCoverUrl(url);
      onCoverChange(url);
      toast.success('Cover image uploaded successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <div className={className}>
      {coverUrl && (
        <div className="mb-4 relative w-48 h-64 mx-auto">
          <Image
            src={coverUrl}
            alt="Book cover"
            className="rounded-lg object-cover"
            fill
          />
        </div>
      )}
      <FileUpload
        onUpload={upload}
        accept={{
          'image/jpeg': ['.jpg', '.jpeg'],
          'image/png': ['.png'],
        }}
        maxSize={2 * 1024 * 1024}
        disabled={isUploading}
      />
      {error && (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      )}
    </div>
  );
} 