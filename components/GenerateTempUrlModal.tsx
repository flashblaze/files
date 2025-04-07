'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Copy, Loader2 } from 'lucide-react'; // Icons for copy and loading
import { useState } from 'react';
import { toast } from 'sonner';

interface GenerateTempUrlModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
}

// Define interface for the API response
interface ApiResponse {
  url?: string;
  error?: string;
}

// Helper function to copy text (can be moved to utils)
async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Temporary URL copied to clipboard!');
  } catch (err) {
    console.error('Failed to copy text: ', err);
    toast.error('Failed to copy URL.');
  }
}

export default function GenerateTempUrlModal({
  isOpen,
  onClose,
  fileName,
}: GenerateTempUrlModalProps) {
  const [expirationMinutes, setExpirationMinutes] = useState<number>(60); // Default to 60 minutes
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleExpirationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(event.target.value, 10);
    setExpirationMinutes(Number.isNaN(value) ? 0 : value);
  };

  const handleGenerateUrl = async () => {
    if (expirationMinutes <= 0) {
      setError('Expiration must be a positive number of minutes.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedUrl(null);

    console.log(
      `LOG: Attempting to generate URL for ${fileName} with expiration ${expirationMinutes} minutes.`
    ); // Validation log

    try {
      // Replace placeholder with actual API call to the new endpoint
      const response = await fetch('/api/files/generate-temp-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName, expiresInMinutes: expirationMinutes }),
      });

      // Type the result using the ApiResponse interface
      const result: ApiResponse = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Failed to generate temporary URL from API.');
      }

      if (!result.url) {
        throw new Error('API did not return a URL.');
      }

      console.log(`LOG: Received temporary URL from API: ${result.url}`); // Validation log
      setGeneratedUrl(result.url);

      // --- Placeholder Logic Removed ---
      // await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate network delay
      // const placeholderUrl = `https://example-r2-bucket.com/${fileName}?temp_token=xyz&expires=${Date.now() + expirationMinutes * 60000}`;
      // console.log(`LOG: Placeholder URL generated: ${placeholderUrl}`); // Validation log
      // setGeneratedUrl(placeholderUrl);
      // --- End Placeholder ---
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred.';
      console.error('Error generating temporary URL:', err); // Log the actual error
      setError(message);
      toast.error(`Failed to generate URL: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset state when modal is closed
  const handleClose = () => {
    setGeneratedUrl(null);
    setError(null);
    setIsLoading(false);
    setExpirationMinutes(60); // Reset to default
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Generate Temporary URL</DialogTitle>
          <DialogDescription>Create a time-limited link to share "{fileName}".</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {!generatedUrl && (
            <div className="grid grid-cols-4 items-center gap-4">
              <label
                htmlFor="expiration"
                className="col-span-1 text-right font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Expires in (minutes)
              </label>
              <Input
                id="expiration"
                type="number"
                value={expirationMinutes}
                onChange={handleExpirationChange}
                className="col-span-3"
                min="1"
                disabled={isLoading}
              />
            </div>
          )}

          {generatedUrl && (
            <div className="space-y-2">
              <label
                htmlFor="generatedUrlInput"
                className="font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Generated URL:
              </label>
              <div className="flex items-center space-x-2">
                <Input
                  id="generatedUrlInput"
                  type="text"
                  value={generatedUrl}
                  readOnly
                  className="flex-grow"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(generatedUrl)}
                  title="Copy URL"
                  className="h-9 w-9 flex-shrink-0"
                >
                  <Copy size={16} />
                </Button>
              </div>
            </div>
          )}

          {error && <p className="text-center text-destructive text-sm">{error}</p>}
        </div>
        <DialogFooter>
          {!generatedUrl && (
            <Button
              type="button"
              onClick={handleGenerateUrl}
              disabled={isLoading || expirationMinutes <= 0}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Link
            </Button>
          )}
          <Button variant="outline" onClick={handleClose}>
            {generatedUrl ? 'Close' : 'Cancel'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
