import { AlertTriangle, Loader } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog';
import { Button } from '~/components/ui/button';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>; // Make confirm async
  fileName: string | null;
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  fileName,
}: DeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Reset state when modal opens or closes
  useEffect(() => {
    if (!isOpen) {
      // Delay resetting state slightly
      setTimeout(() => {
        setIsDeleting(false);
        setDeleteError(null);
      }, 300); // Match default animation duration
    }
  }, [isOpen]);

  const handleConfirmClick = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await onConfirm();
      // Parent component will handle closing on success
    } catch (error) {
      console.error('Delete confirmation error:', error);
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete file.');
      setIsDeleting(false); // Re-enable buttons on error
    }
    // Do not set isDeleting to false on success, AlertDialog handles close
  };

  // Use AlertDialog open prop controlled by isOpen
  // Use onOpenChange prop to call onClose when dismissed
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-red-600" aria-hidden="true" />
            Delete File
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the file{' '}
            <strong className="break-all">{fileName || 'this file'}</strong>? This action cannot be
            undone.
            {deleteError && <p className="mt-2 text-red-600 text-sm">Error: {deleteError}</p>}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting} onClick={onClose}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            asChild // Use asChild to render the custom Button
            disabled={isDeleting}
            onClick={handleConfirmClick}
            className="bg-red-600 hover:bg-red-500" // Keep destructive styling
          >
            <Button disabled={isDeleting} variant="destructive">
              {isDeleting ? (
                <Loader className="-mr-1 ml-2 h-5 w-5 animate-spin" aria-hidden="true" />
              ) : null}
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
