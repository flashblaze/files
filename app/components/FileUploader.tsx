'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation'; // Use App Router's navigation
import { Upload } from 'lucide-react'; // Import Upload icon
import UploadModal from './UploadModal';

export default function FileUploader() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleUploadSuccess = () => {
    // Refresh the current route to fetch the updated file list
    // This keeps the client state (like scroll position)
    router.refresh();
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpenModal}
        className="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-600 px-3 py-2 font-semibold text-sm text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600 focus-visible:outline-offset-2"
      >
        <Upload className="-ml-0.5 h-5 w-5" aria-hidden="true" />
        Upload File
      </button>
      <UploadModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onUploadSuccess={handleUploadSuccess}
      />
    </>
  );
}
