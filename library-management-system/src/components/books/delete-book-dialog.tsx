'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface DeleteBookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookId: string;
  bookTitle: string;
}

export function DeleteBookDialog({
  open,
  onOpenChange,
  bookId,
  bookTitle,
}: DeleteBookDialogProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Use shared toast hook
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/books/${bookId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete book');
      }

      toast({
        title: 'Book deleted',
        description: `"${bookTitle}" has been deleted successfully.`,
      });

      // Close the dialog and redirect to books list
      onOpenChange(false);
      router.push('/dashboard/books');
      router.refresh();
    } catch (error) {
      console.error('Error deleting book:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete book. Please try again.',
        type: 'error',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" />
      <div className="relative z-50 w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <div className="flex flex-col space-y-4">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Delete Book</h2>
            <p className="text-sm text-gray-500">
              Are you sure you want to delete "{bookTitle}"? This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Book'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
