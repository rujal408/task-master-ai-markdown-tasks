import React, { useState, useRef, ChangeEvent } from 'react';
import Image from 'next/image';
import { UploadFileType, uploadConfigs } from '@/types/file-upload';
import { X, Upload, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

type FileUploadProps = {
  uploadType: 'bookCover' | 'profilePicture';
  onUploadComplete: (file: UploadFileType) => void;
  onUploadError?: (error: string) => void;
  entityId?: string;
  existingFile?: UploadFileType | null;
  className?: string;
};

export function FileUpload({
  uploadType,
  onUploadComplete,
  onUploadError,
  entityId,
  existingFile,
  className,
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(existingFile?.url || null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const config = uploadConfigs[uploadType];

  const allowedTypesString = config.allowedTypes
    .map(type => `.${type.split('/')[1]}`)
    .join(', ');

  // Handle file selection
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccess(false);
    
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const selectedFile = e.target.files[0];
    
    // Validate file type
    if (!config.allowedTypes.includes(selectedFile.type)) {
      setError(`Invalid file type. Allowed types: ${allowedTypesString}`);
      return;
    }
    
    // Validate file size
    if (selectedFile.size > config.maxSize) {
      setError(`File size exceeds the maximum allowed size of ${config.maxSize / (1024 * 1024)}MB`);
      return;
    }
    
    setFile(selectedFile);
    
    // Generate preview
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreview(objectUrl);
    
    // Clear input value to allow selecting the same file again
    e.target.value = '';
  };

  // Upload file
  const uploadFile = async () => {
    if (!file) return;
    
    setUploading(true);
    setProgress(10);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('type', uploadType);
      if (entityId) {
        queryParams.append('entityId', entityId);
      }
      
      const response = await fetch(`/api/upload?${queryParams.toString()}`, {
        method: 'POST',
        body: formData,
      });
      
      setProgress(90);
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Upload failed');
      }
      
      setProgress(100);
      setSuccess(true);
      onUploadComplete(data.file);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setError(errorMessage);
      if (onUploadError) {
        onUploadError(errorMessage);
      }
    } finally {
      setUploading(false);
    }
  };

  // Remove selected file
  const removeFile = () => {
    setFile(null);
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    setError(null);
    setSuccess(false);
  };

  // Delete existing file
  const deleteExistingFile = async () => {
    if (!existingFile) return;
    
    try {
      setUploading(true);
      
      const response = await fetch(`/api/files/${encodeURIComponent(existingFile.uploadPath)}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Deletion failed');
      }
      
      setPreview(null);
      onUploadComplete({ ...existingFile, url: '' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Deletion failed';
      setError(errorMessage);
      if (onUploadError) {
        onUploadError(errorMessage);
      }
    } finally {
      setUploading(false);
    }
  };

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-col items-center">
        {/* File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={config.allowedTypes.join(',')}
          className="hidden"
          disabled={uploading}
        />
        
        {/* Preview Area */}
        <div className="relative w-full h-48 border-2 border-dashed rounded-lg overflow-hidden bg-muted/50 mb-2">
          {preview ? (
            <div className="relative w-full h-full">
              <Image
                src={preview}
                alt="Preview"
                className="object-contain"
                fill
                sizes="(max-width: 768px) 100vw, 300px"
              />
              {!uploading && (
                <button
                  onClick={file ? removeFile : deleteExistingFile}
                  className="absolute top-2 right-2 p-1 bg-background/80 rounded-full hover:bg-background"
                  type="button"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              )}
            </div>
          ) : (
            <div 
              className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
              onClick={triggerFileInput}
            >
              <Upload className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground text-center px-4">
                Click to upload {uploadType === 'bookCover' ? 'book cover' : 'profile picture'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {allowedTypesString} up to {config.maxSize / (1024 * 1024)}MB
              </p>
            </div>
          )}
        </div>
        
        {/* Progress Bar */}
        {uploading && (
          <div className="w-full mt-2">
            <Progress value={progress} className="h-2" />
          </div>
        )}
        
        {/* Error Message */}
        {error && (
          <div className="flex items-center text-destructive text-sm mt-2">
            <AlertCircle className="h-4 w-4 mr-1" />
            <span>{error}</span>
          </div>
        )}
        
        {/* Success Message */}
        {success && (
          <div className="flex items-center text-green-500 text-sm mt-2">
            <Check className="h-4 w-4 mr-1" />
            <span>File uploaded successfully</span>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          {!preview && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={triggerFileInput}
              disabled={uploading}
            >
              Select File
            </Button>
          )}
          
          {file && !uploading && !success && (
            <Button 
              type="button" 
              onClick={uploadFile}
            >
              Upload
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
