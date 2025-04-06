import FileUploader from './components/FileUploader';
import FileCard from './components/FileCard';

// Define the expected shape of a file object from the API
interface R2File {
  name: string;
  type: string;
  size: number;
  uploaded: string; // Assuming API returns date as string
}

// Define types for API responses
interface FileListResponse {
  files?: R2File[];
  error?: string; // Include potential error field
}

interface ErrorResponse {
  error?: string;
}

// Helper function to fetch files from our API endpoint
async function getFiles(): Promise<R2File[]> {
  console.log('Fetching files from /api/files');
  try {
    const apiUrl =
      process.env.NODE_ENV === 'production'
        ? 'YOUR_PRODUCTION_URL/api/files' // IMPORTANT: Replace with your actual production URL
        : 'http://localhost:3000/api/files';

    const res = await fetch(apiUrl, {
      method: 'GET',
      cache: 'no-store',
    });

    // Check response status before parsing JSON
    if (!res.ok) {
      let errorMessage = 'Failed to fetch files';
      try {
        // Try to parse error message from response body
        const errorData: ErrorResponse = await res.json();
        errorMessage = errorData.error || `API Error: ${res.statusText}`;
      } catch (parseError) {
        // Fallback if parsing JSON fails
        console.error('Failed to parse error response:', parseError);
      }
      console.error('API Error fetching files:', errorMessage);
      throw new Error(errorMessage);
    }

    // Parse successful response
    const data: FileListResponse = await res.json();
    console.log('Successfully fetched files:', data.files?.length || 0);
    return data.files || []; // Return files array or empty array
  } catch (error) {
    console.error('Error in getFiles function:', error);
    return []; // Return empty array on any error
  }
}

export default async function HomePage() {
  // Fetch the file list directly in the Server Component
  const files = await getFiles();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="mb-8 flex items-center justify-between border-gray-200 border-b pb-4">
        <h1 className="font-bold text-3xl text-gray-900 tracking-tight">Your Files</h1>
        <FileUploader />
      </header>

      <main>
        {files.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-lg border-2 border-gray-300 border-dashed">
            <p className="text-center text-gray-500">No files found. Upload your first file!</p>
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
