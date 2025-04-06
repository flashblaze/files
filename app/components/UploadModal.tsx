'use client';

import { useState, useRef, useEffect } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { X, Loader2 } from 'lucide-react'; // Import Lucide icons

// Define a type for the API response from the upload endpoint
type UploadApiResponse = {
  success: boolean;
  fileName?: string;
  etag?: string; // Assuming the POST /api returns etag now
  error?: string;
};

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void; // Callback to refresh file list
}

export default function UploadModal({ isOpen, onClose, onUploadSuccess }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isError, setIsError] = useState<boolean>(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for the file input

  // Reset state when modal opens or closes
  useEffect(() => {
    if (!isOpen) {
      // Delay resetting state slightly to allow closing animation if any
      setTimeout(() => {
        setFile(null);
        setStatusMessage('');
        setIsError(false);
        setIsLoading(false); // Ensure loading is reset
        // Reset the file input value visually
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 300); // Adjust timing if needed
    }
  }, [isOpen]);

  // Handle clicks outside the modal to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
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
  }, [isOpen, onClose]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files ? e.target.files[0] : null;
    setFile(selectedFile);
    setStatusMessage('');
    setIsError(false);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      setStatusMessage('Please select a file first.');
      setIsError(true);
      return;
    }

    setIsLoading(true);
    setStatusMessage('Uploading...');
    setIsError(false);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Call the original upload endpoint
      const response = await fetch('/api', {
        method: 'POST',
        body: formData,
      });

      const result: UploadApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to upload file.');
      }

      setStatusMessage(`Successfully uploaded ${result.fileName}!`);
      onUploadSuccess(); // Notify parent to refresh list
      setTimeout(onClose, 1500); // Close modal after a short delay on success
    } catch (error) {
      console.error('Upload error:', error);
      setStatusMessage(error instanceof Error ? error.message : 'An unknown error occurred.');
      setIsError(true);
    } finally {
      // Keep loading true until modal closes on success, reset otherwise
      if (isError || !statusMessage.startsWith('Successfully')) {
        setIsLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.5)] backdrop-blur-sm">
      <div ref={modalRef} className="relative w-full max-w-md rounded-lg bg-white p-8 shadow-xl">
        {/* Close Button with Lucide X icon */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:text-gray-300"
          aria-label="Close modal"
          disabled={isLoading}
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        <h2 className="mb-6 text-center font-semibold text-gray-700 text-xl">Upload New File</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="modalFileInput"
              className="mb-1 block font-medium text-gray-600 text-sm"
            >
              Choose File
            </label>
            <input
              ref={fileInputRef} // Attach ref here
              id="modalFileInput"
              type="file"
              onChange={handleFileChange}
              className="block w-full text-gray-500 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:font-semibold file:text-blue-700 file:text-sm hover:file:bg-blue-100 disabled:opacity-50"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !file}
            className="flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-white transition duration-150 ease-in-out hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {isLoading ? (
              // Use Lucide Loader2 icon
              <Loader2 className="-ml-1 mr-3 h-5 w-5 animate-spin" aria-hidden="true" />
            ) : null}
            {isLoading ? 'Uploading...' : 'Upload'}
          </button>
        </form>
        {statusMessage && (
          <p className={`mt-4 text-center text-sm ${isError ? 'text-red-600' : 'text-green-600'}`}>
            {statusMessage}
          </p>
        )}
      </div>
    </div>
  );
}
