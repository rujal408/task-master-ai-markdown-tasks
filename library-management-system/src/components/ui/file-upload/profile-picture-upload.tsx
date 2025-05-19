import React from 'react';
import { FileUpload } from './file-upload';
import { UploadFileType } from '@/types/file-upload';
import { Label } from '@/components/ui/label';

type ProfilePictureUploadProps = {
  userId?: string;
  existingPicture?: UploadFileType | null;
  onUploadComplete: (file: UploadFileType) => void;
  onUploadError?: (error: string) => void;
  className?: string;
  label?: string;
  required?: boolean;
};

export function ProfilePictureUpload({
  userId,
  existingPicture,
  onUploadComplete,
  onUploadError,
  className,
  label = 'Profile Picture',
  required = false,
}: ProfilePictureUploadProps) {
  return (
    <div className={className}>
      {label && (
        <Label className="mb-2 block">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      <FileUpload
        uploadType="profilePicture"
        entityId={userId}
        existingFile={existingPicture}
        onUploadComplete={onUploadComplete}
        onUploadError={onUploadError}
      />
    </div>
  );
}
