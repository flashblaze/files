'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress'; // Import Progress
import { Loader2, UploadCloud } from 'lucide-react'; // Added UploadCloud
import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';

// Type for the presigned URL API response
interface PresignedUrlResponse {
  url: string;
  method: 'PUT'; // Expect PUT
  error?: string;
}

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

export default function UploadModal({ isOpen, onClose, onUploadSuccess }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isError, setIsError] = useState<boolean>(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0); // State for progress
  const xhrRef = useRef<XMLHttpRequest | null>(null); // Ref to manage XHR request for cancellation

  // Reset state when modal opens or closes
  useEffect(() => {
    if (!isOpen) {
      // Cancel any ongoing upload if modal is closed
      if (xhrRef.current) {
        xhrRef.current.abort();
        xhrRef.current = null;
      }
      // Delay resetting state slightly to allow closing animation if any
      setTimeout(() => {
        setFile(null);
        setStatusMessage('');
        setIsError(false);
        setIsLoading(false);
        setUploadProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 300);
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
    setUploadProgress(0); // Reset progress on new file selection
  };

  // Function to cancel upload
  const handleCancelUpload = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
      setIsLoading(false);
      setStatusMessage('Upload cancelled.');
      setUploadProgress(0);
    }
  };

  // Handle Dialog close attempt (Overlay click, Esc, X button)
  const handleDialogClose = (open: boolean) => {
    if (!open) {
      if (isLoading) {
        handleCancelUpload(); // Cancel ongoing upload if user closes dialog
      }
      onClose(); // Call the original onClose handler
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      setStatusMessage('Please select a file first.');
      setIsError(true);
      return;
    }

    setIsLoading(true);
    setStatusMessage('Preparing upload...');
    setIsError(false);
    setUploadProgress(0);

    try {
      // 1. Get the pre-signed URL from our API
      const presignedUrlResponse = await fetch('/api/uploads/presigned-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
        }),
      });

      const presignedData: PresignedUrlResponse = await presignedUrlResponse.json();

      if (!presignedUrlResponse.ok || !presignedData.url) {
        throw new Error(presignedData.error || 'Failed to get pre-signed URL.');
      }

      setStatusMessage('Uploading...');

      // 2. Upload the file directly to R2 using XMLHttpRequest for progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr; // Store ref to allow cancellation

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percentComplete);
            setStatusMessage(`Uploading... ${percentComplete}%`);
          }
        };

        xhr.onload = () => {
          xhrRef.current = null; // Clear ref
          if (xhr.status >= 200 && xhr.status < 300) {
            setStatusMessage(`Successfully uploaded ${file.name}!`);
            onUploadSuccess(); // Notify parent to refresh list
            setTimeout(onClose, 1500); // Close modal after delay
            resolve();
          } else {
            console.error(
              `Direct R2 upload failed. Status: ${xhr.status}, Response: ${xhr.responseText}`
            );
            reject(
              new Error(
                `Upload failed: ${xhr.statusText || 'Network Error'} (Status ${xhr.status})`
              )
            );
          }
        };

        xhr.onerror = () => {
          xhrRef.current = null; // Clear ref
          console.error('Direct R2 upload failed due to network error.');
          reject(new Error('Network error during upload.'));
        };

        xhr.onabort = () => {
          xhrRef.current = null; // Clear ref
          // Don't reject here, handleCancelUpload sets status
        };

        xhr.open(presignedData.method, presignedData.url);
        xhr.setRequestHeader('Content-Type', file.type);
        // Add other headers if required by R2/Cloudflare (e.g., custom metadata via headers if configured)
        xhr.send(file);
      });
    } catch (error) {
      console.error('Upload process error:', error);
      setStatusMessage(error instanceof Error ? error.message : 'An unknown error occurred.');
      setIsError(true);
      setIsLoading(false); // Stop loading on error
      setUploadProgress(0); // Reset progress on error
      xhrRef.current = null; // Clear ref if error happened before XHR setup
    }
    // Note: finally block removed as loading state is handled differently now
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload New File</DialogTitle>
          {/* Optional: Add DialogDescription if needed */}
          {/* <DialogDescription>Select a file and click upload.</DialogDescription> */}
        </DialogHeader>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Input Area */}
          <div className="flex w-full items-center justify-center">
            <label
              htmlFor="modalFileInput"
              className={`flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed ${isError ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-gray-50'} hover:bg-gray-100`}
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadCloud
                  className={`mb-3 h-8 w-8 ${isError ? 'text-red-500' : 'text-gray-400'}`}
                  aria-hidden="true"
                />
                {file ? (
                  <p className="mb-2 text-gray-700 text-sm">
                    <span className="font-semibold">Selected:</span> {file.name}
                  </p>
                ) : (
                  <p className="mb-2 text-gray-500 text-sm">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                )}
                <p className="text-gray-500 text-xs">Any file type, max size limited by R2/Plan</p>
              </div>
              <input
                id="modalFileInput"
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                disabled={isLoading}
              />
            </label>
          </div>

          {/* Progress Bar */}
          {isLoading && uploadProgress >= 0 && (
            // Use Shadcn Progress component
            <Progress value={uploadProgress} className="h-2 w-full" />
          )}

          {/* Status Message - Placed above footer */}
          {statusMessage && (
            <p className={`text-center text-sm ${isError ? 'text-red-600' : 'text-green-600'}`}>
              {statusMessage}
            </p>
          )}

          {/* Footer with Action Buttons */}
          <DialogFooter>
            {/* Conditional Upload/Cancel Button */}
            <Button
              type={isLoading ? 'button' : 'submit'} // Change type based on state
              onClick={isLoading ? handleCancelUpload : undefined} // Explicit cancel onClick
              disabled={!file && !isLoading} // Disabled if no file selected (and not loading)
              variant={isLoading ? 'destructive' : 'default'} // Destructive variant for Cancel
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancel Upload
                </>
              ) : (
                'Upload File'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
