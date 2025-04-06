import FileUploader from './components/FileUploader';
import FileCard from './components/FileCard';
// Import the shared function and the specific type it returns
import { listFilesFromR2, type R2ListedFile } from '../lib/r2-actions'; // Adjust path

// Remove R2File interface if it's identical to R2ListedFile
// interface R2File { ... }

// Remove FileListResponse and ErrorResponse if no longer needed here
// interface FileListResponse { ... }
// interface ErrorResponse { ... }

// Rename or modify getFiles to directly call the shared server action
async function getFilesDirectly(): Promise<R2ListedFile[]> {
  try {
    const files = await listFilesFromR2();
    return files;
  } catch (error) {
    console.error('PAGE: Error calling listFilesFromR2 directly:', error);
    // Return empty array to prevent breaking the page, error is logged
    return [];
  }
}

export default async function HomePage() {
  // Call the direct function instead of the one using fetch
  const files = await getFilesDirectly();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="mb-8 flex items-center justify-between border-gray-200 border-b pb-4">
        <h1 className="font-bold text-3xl text-gray-900 tracking-tight">Your Files</h1>
        <FileUploader />
      </header>

      <main>
        {files.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-lg border-2 border-gray-300 border-dashed">
            {/* Update empty state message if desired */}
            <p className="text-center text-gray-500">No files found or failed to load files.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {files.map((file) => (
              <FileCard
                key={file.name}
                file={file} // file should now match R2ListedFile type
                // formatBytes and formatDate are now defined within FileCard
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
