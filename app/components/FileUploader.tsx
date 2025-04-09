import { Upload } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import UploadModal from './UploadModal';
import { Button } from './ui/button';

export default function FileUploader() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleUploadSuccess = () => {
    // Refresh the current route to fetch the updated file list
    // This keeps the client state (like scroll position)
    navigate(0);
  };

  return (
    <>
      <Button onClick={handleOpenModal}>
        <Upload className="-ml-0.5 h-5 w-5" aria-hidden="true" />
        Upload File
      </Button>
      <UploadModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onUploadSuccess={handleUploadSuccess}
      />
    </>
  );
}
