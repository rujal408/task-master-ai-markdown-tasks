import React from 'react';
import { FileUpload } from './file-upload';
import { UploadFileType } from '@/types/file-upload';
import { Label } from '@/components/ui/label';

type BookCoverUploadProps = {
  bookId?: string;
  existingCover?: UploadFileType | null;
  onUploadComplete: (file: UploadFileType) => void;
  onUploadError?: (error: string) => void;
  className?: string;
  label?: string;
  required?: boolean;
};

export function BookCoverUpload({
  bookId,
  existingCover,
  onUploadComplete,
  onUploadError,
  className,
  label = 'Book Cover',
  required = false,
}: BookCoverUploadProps) {
  return (
    <div className={className}>
      {label && (
        <Label className="mb-2 block">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      <FileUpload
        uploadType="bookCover"
        entityId={bookId}
        existingFile={existingCover}
        onUploadComplete={onUploadComplete}
        onUploadError={onUploadError}
      />
    </div>
  );
}
