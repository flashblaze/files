'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Share2, Trash2, Copy, Check } from 'lucide-react'; // Import icons
import DeleteConfirmationModal from './DeleteConfirmationModal';

// Define the expected shape of a file object passed as prop
interface R2File {
  name: string;
  type: string;
  size: number;
  uploaded: string; // Raw date string from API
}

// Update FileCardProps: remove formatBytes and formatDate
interface FileCardProps {
  file: R2File;
}

// Define type for DELETE API response
interface DeleteApiResponse {
  success: boolean;
  deletedFile?: string;
  error?: string;
}

// Simple debounce function
function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

// Move helper functions here
function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
}

function formatDate(dateString: string): string {
  try {
    // Use default locale formatting
    return new Date(dateString).toLocaleString();
  } catch (_error) {
    console.warn(`Failed to parse date string: ${dateString}`);
    return 'Invalid Date';
  }
}

export default function FileCard({ file }: FileCardProps) {
  const router = useRouter();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    try {
      const response = await fetch(`/api/files/${encodeURIComponent(file.name)}`, {
        method: 'DELETE',
      });

      // Add type assertion for the response JSON
      const result: DeleteApiResponse = await response.json();

      if (!response.ok || !result.success) {
        // Use the error from the API response if available
        throw new Error(result.error || 'Failed to delete file from API.');
      }

      setIsDeleteModalOpen(false); // Close modal on success
      router.refresh(); // Refresh page to update file list
    } catch (error) {
      console.error('Error confirming delete:', error);
      // Re-throw the error to be caught and displayed by the modal
      throw error;
    }
  };

  // Debounced copy function
  const copyFileName = debounce(() => {
    navigator.clipboard
      .writeText(file.name)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Reset icon after 2 seconds
      })
      .catch((err) => {
        console.error('Failed to copy filename: ', err);
        // Optionally show an error message to the user
      });
  }, 300); // 300ms debounce time

  return (
    <>
      <div className="relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
        <div className="flex-grow">
          <p className="truncate font-semibold text-gray-800 text-lg" title={file.name}>
            {file.name}
          </p>
          <p className="mt-1 text-gray-500 text-sm">
            Type: <span className="text-gray-700">{file.type}</span>
          </p>
          {/* Call the local formatBytes function */}
          <p className="mt-1 text-gray-500 text-sm">
            Size: <span className="text-gray-700">{formatBytes(file.size)}</span>
          </p>
          {/* Call the local formatDate function */}
          <p className="mt-1 text-gray-500 text-sm">
            Uploaded: <span className="text-gray-700">{formatDate(file.uploaded)}</span>
          </p>
        </div>
        {/* Action Buttons */}
        <div className="mt-4 flex justify-end space-x-2 border-gray-100 border-t pt-3">
          <button
            type="button"
            onClick={copyFileName}
            title="Copy filename"
            className="rounded p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
          >
            {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
            <span className="sr-only">Copy filename</span>
          </button>
          {/* Placeholder for Share button - currently copies filename */}
          <button
            type="button"
            onClick={copyFileName} // Using copy for now
            title="Share file (copies filename)"
            className="rounded p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
          >
            <Share2 size={18} />
            <span className="sr-only">Share file</span>
          </button>
          <button
            type="button"
            onClick={handleDeleteClick}
            title="Delete file"
            className="rounded p-1.5 text-red-500 transition hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
          >
            <Trash2 size={18} />
            <span className="sr-only">Delete file</span>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        fileName={file.name}
      />
    </>
  );
}
