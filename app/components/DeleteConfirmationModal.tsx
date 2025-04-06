'use client';

import { useRef, useEffect, useState } from 'react';
import { AlertTriangle, Loader } from 'lucide-react'; // Use Lucide icons

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
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset state when modal opens or closes
  useEffect(() => {
    if (!isOpen) {
      // Delay resetting state slightly
      setTimeout(() => {
        setIsDeleting(false);
        setDeleteError(null);
      }, 300);
    }
  }, [isOpen]);

  // Handle clicks outside the modal to close it (only if not deleting)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isDeleting && modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, isDeleting]);

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
    // Do not set isDeleting to false on success, let parent handle close
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
      <div ref={modalRef} className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="flex items-start space-x-4">
          <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
            <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-lg leading-6" id="modal-title">
              Delete File
            </h3>
            <div className="mt-2">
              <p className="text-gray-500 text-sm">
                Are you sure you want to delete the file{' '}
                <strong className="break-all">{fileName || 'this file'}</strong>? This action cannot
                be undone.
              </p>
            </div>
            {deleteError && <p className="mt-2 text-red-600 text-sm">Error: {deleteError}</p>}
          </div>
        </div>
        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse sm:space-x-2 sm:space-x-reverse">
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleConfirmClick}
            className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 font-semibold text-sm text-white shadow-sm hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {isDeleting ? (
              <Loader className="-ml-1 mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
            ) : null}
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
          <button
            type="button"
            disabled={isDeleting} // Also disable cancel while deleting
            onClick={onClose}
            className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 font-semibold text-gray-900 text-sm shadow-sm ring-1 ring-gray-300 ring-inset hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:mt-0 sm:w-auto"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
