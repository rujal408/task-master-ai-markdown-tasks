'use client';

import { useState } from 'react';
type BookStatus = 'AVAILABLE' | 'CHECKED_OUT' | 'RESERVED' | 'LOST' | 'DAMAGED' | 'PROCESSING';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface UpdateStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookId: string;
  currentStatus: BookStatus;
  onStatusUpdate?: () => void;
}

const statusOptions = [
  { value: 'AVAILABLE' as const, label: 'Available' },
  { value: 'CHECKED_OUT' as const, label: 'Checked Out' },
  { value: 'RESERVED' as const, label: 'Reserved' },
  { value: 'LOST' as const, label: 'Lost' },
  { value: 'DAMAGED' as const, label: 'Damaged' },
  { value: 'PROCESSING' as const, label: 'Processing' },
] as const;

export function UpdateStatusDialog({
  open,
  onOpenChange,
  bookId,
  currentStatus,
  onStatusUpdate,
}: UpdateStatusDialogProps) {
  const { toast } = useToast();
  const [status, setStatus] = useState<BookStatus>(currentStatus as BookStatus);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusUpdate = async () => {
    try {
      setIsUpdating(true);
      const response = await fetch(`/api/books/${bookId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update book status');
      }

      toast({
        title: 'Status updated',
        description: `Book status has been updated to "${statusOptions.find(s => s.value === status)?.label}".`,
      });

      // Call the callback if provided
      if (onStatusUpdate) {
        onStatusUpdate();
      }

      // Close the dialog
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating book status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update book status. Please try again.',
        type: 'error',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Book Status</DialogTitle>
          <DialogDescription>
            Change the status of this book in the library system.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Select
            value={status}
            onValueChange={(value: BookStatus) => setStatus(value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleStatusUpdate}
            disabled={isUpdating || status === currentStatus}
          >
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Status'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
