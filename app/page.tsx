import { type R2ListedFile, listFilesFromR2 } from '../lib/r2-actions';
import FileCard from './components/FileCard';
import FileUploader from './components/FileUploader';

async function getFilesDirectly(): Promise<R2ListedFile[]> {
  try {
    const files = await listFilesFromR2();
    return files;
  } catch (error) {
    console.error('PAGE: Error calling listFilesFromR2 directly:', error);
    return [];
  }
}

export default async function HomePage() {
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
            <p className="text-center text-gray-500">No files found or failed to load files.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {files.map((file) => (
              <FileCard key={file.name} file={file} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
