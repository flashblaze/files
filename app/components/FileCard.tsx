import dayjs from 'dayjs';
import { Check, Share2, Trash2, Wind } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';

import DeleteConfirmationModal from './DeleteConfirmationModal';
import GenerateTempUrlModal from './GenerateTempUrlModal';

interface R2File {
  name: string;
  type: string;
  size: number;
  uploaded: string;
}

interface FileCardProps {
  file: R2File;
  publicR2Url: string;
}

interface DeleteApiResponse {
  success: boolean;
  deletedFile?: string;
  error?: string;
}

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

function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
}

export default function FileCard({ file, publicR2Url }: FileCardProps) {
  const navigate = useNavigate();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTempUrlModalOpen, setIsTempUrlModalOpen] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
  };

  const handleOpenTempUrlModal = () => {
    setIsTempUrlModalOpen(true);
  };

  const handleCloseTempUrlModal = () => {
    setIsTempUrlModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    try {
      const response = await fetch(`/api/files/${encodeURIComponent(file.name)}`, {
        method: 'DELETE',
      });

      const result: DeleteApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to delete file from API.');
      }

      setIsDeleteModalOpen(false);
      navigate(0);
    } catch (error) {
      console.error('Error confirming delete:', error);
      throw error;
    }
  };

  const copyFileURL = debounce(() => {
    const urlToCopy = `${publicR2Url}/${file.name}`;
    navigator.clipboard
      .writeText(urlToCopy)
      .then(() => {
        setUrlCopied(true);
        toast.success('File URL copied to clipboard');
        setTimeout(() => {
          setUrlCopied(false);
        }, 2000);
      })
      .catch((err) => {
        console.error('Failed to copy file URL: ', err);
        toast.error('Failed to copy file URL');
      });
  }, 300);

  const formattedDate = dayjs(file.uploaded).format('ddd, MMM D h:mm A');

  return (
    <>
      <Card className="flex flex-col overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="truncate text-lg" title={file.name}>
            {file.name}
          </CardTitle>
          <CardDescription>
            Type: <span className="font-medium text-foreground">{file.type}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow py-2">
          <p className="text-muted-foreground text-sm">
            Size: <span className="font-medium text-foreground">{formatBytes(file.size)}</span>
          </p>
          <p className="text-muted-foreground text-sm">
            Uploaded: <span className="font-medium text-foreground">{formattedDate}</span>
          </p>
        </CardContent>
        <CardFooter className="flex justify-end space-x-1 pt-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleOpenTempUrlModal}
            title="Generate temporary URL"
            className="h-8 w-8"
          >
            <Wind size={16} />
            <span className="sr-only">Generate temporary URL</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={copyFileURL}
            title="Share file (copies URL)"
            className="h-8 w-8"
          >
            {urlCopied ? <Check size={16} className="text-green-600" /> : <Share2 size={16} />}
            <span className="sr-only">Share file</span>
          </Button>
          <Button
            variant="destructive"
            size="icon"
            onClick={handleDeleteClick}
            title="Delete file"
            className="h-8 w-8"
          >
            <Trash2 size={16} />
            <span className="sr-only">Delete file</span>
          </Button>
        </CardFooter>
      </Card>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        fileName={file.name}
      />

      <GenerateTempUrlModal
        isOpen={isTempUrlModalOpen}
        onClose={handleCloseTempUrlModal}
        fileName={file.name}
      />
    </>
  );
}
