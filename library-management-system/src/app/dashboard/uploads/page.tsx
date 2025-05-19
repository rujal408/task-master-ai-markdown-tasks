'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookCoverUpload, ProfilePictureUpload } from '@/components/ui/file-upload';
import { UploadFileType } from '@/types/file-upload';
import { useToast } from '@/components/ui/use-toast';
import { useSession } from 'next-auth/react';
import { BookIcon, UserIcon } from 'lucide-react';

export default function UploadsPage() {
  const { toast } = useToast();
  const { data: session } = useSession();
  const userId = session?.user?.id;
  
  const [bookCover, setBookCover] = useState<UploadFileType | null>(null);
  const [profilePicture, setProfilePicture] = useState<UploadFileType | null>(null);

  const handleBookCoverUpload = (file: UploadFileType) => {
    setBookCover(file);
    toast({
      title: 'Book cover uploaded',
      description: `File ${file.name} was successfully uploaded.`,
    });
  };

  const handleProfilePictureUpload = (file: UploadFileType) => {
    setProfilePicture(file);
    toast({
      title: 'Profile picture uploaded',
      description: `File ${file.name} was successfully uploaded.`,
    });
  };

  const handleUploadError = (error: string) => {
    toast({
      title: 'Upload failed',
      description: error,
      variant: 'destructive',
    });
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">File Upload System</h1>
      
      <Tabs defaultValue="bookCovers" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="bookCovers" className="flex items-center gap-2">
            <BookIcon className="h-4 w-4" />
            Book Covers
          </TabsTrigger>
          <TabsTrigger value="profilePictures" className="flex items-center gap-2">
            <UserIcon className="h-4 w-4" />
            Profile Pictures
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="bookCovers">
          <Card>
            <CardHeader>
              <CardTitle>Upload Book Cover</CardTitle>
              <CardDescription>
                Upload book cover images for the library catalog. Supported formats: JPEG, PNG, WebP. 
                Maximum file size: 5MB.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <BookCoverUpload
                onUploadComplete={handleBookCoverUpload}
                onUploadError={handleUploadError}
              />
              
              {bookCover && bookCover.url && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Uploaded File Details:</h3>
                  <ul className="text-sm space-y-1">
                    <li><span className="font-medium">Name:</span> {bookCover.name}</li>
                    <li><span className="font-medium">Size:</span> {(bookCover.size / 1024).toFixed(2)} KB</li>
                    <li><span className="font-medium">Type:</span> {bookCover.type}</li>
                    <li>
                      <span className="font-medium">URL:</span> 
                      <code className="ml-1 p-1 bg-muted rounded text-xs">{bookCover.url}</code>
                    </li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="profilePictures">
          <Card>
            <CardHeader>
              <CardTitle>Upload Profile Picture</CardTitle>
              <CardDescription>
                Upload a profile picture for your user account. Supported formats: JPEG, PNG, WebP. 
                Maximum file size: 2MB.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ProfilePictureUpload
                userId={userId}
                onUploadComplete={handleProfilePictureUpload}
                onUploadError={handleUploadError}
              />
              
              {profilePicture && profilePicture.url && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Uploaded File Details:</h3>
                  <ul className="text-sm space-y-1">
                    <li><span className="font-medium">Name:</span> {profilePicture.name}</li>
                    <li><span className="font-medium">Size:</span> {(profilePicture.size / 1024).toFixed(2)} KB</li>
                    <li><span className="font-medium">Type:</span> {profilePicture.type}</li>
                    <li>
                      <span className="font-medium">URL:</span> 
                      <code className="ml-1 p-1 bg-muted rounded text-xs">{profilePicture.url}</code>
                    </li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="mt-6">
        <h2 className="text-xl font-bold mb-4">File Upload System Documentation</h2>
        <div className="prose max-w-none">
          <p>
            This page demonstrates the file upload system implemented for the library management application.
            It allows users to upload book cover images and profile pictures with validation for file type and size.
          </p>
          
          <h3>Features:</h3>
          <ul>
            <li>Support for various image types (JPEG, PNG, WebP)</li>
            <li>File size validation</li>
            <li>Image preview before upload</li>
            <li>Progress indicator during upload</li>
            <li>Error handling and user feedback</li>
            <li>Secure file storage and access</li>
          </ul>
          
          <h3>Technical Implementation:</h3>
          <ul>
            <li>Server-side API routes for file upload and deletion</li>
            <li>Client-side components for file selection and upload</li>
            <li>Secure file validation on both client and server</li>
            <li>Optimized image display using Next.js Image component</li>
            <li>Organized file storage structure by type and entity</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
