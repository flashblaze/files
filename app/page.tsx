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
  console.log('Attempting to fetch files...');
  try {
    const apiUrl =
      process.env.NODE_ENV === 'production'
        ? 'YOUR_PRODUCTION_URL/api/files' // IMPORTANT: Ensure this is correct!
        : 'http://localhost:3000/api/files';
    console.log(`Using API URL: ${apiUrl}`); // Log the URL being used

    const res = await fetch(apiUrl, {
      method: 'GET',
      cache: 'no-store',
    });

    console.log(`Fetch response status: ${res.status}, OK: ${res.ok}`); // Log response status

    if (!res.ok) {
      let errorBody = '';
      let errorMessage = `API Error ${res.status}: ${res.statusText}`;
      try {
        errorBody = await res.text(); // Try to get raw error body
        console.error(`API Error Response Body: ${errorBody}`);
        const errorData: ErrorResponse = JSON.parse(errorBody);
        errorMessage = errorData.error || `API Error: ${res.statusText}`;
      } catch (parseError) {
        errorMessage = `API Error ${res.status}: ${res.statusText}. Body: ${errorBody || '(could not read body)'}`;
        console.error('Failed to parse error response:', parseError);
      }
      console.error('API Error fetching files:', errorMessage);
      throw new Error(errorMessage);
    }

    // Try getting raw text first for successful responses too, for debugging
    const rawBody = await res.text();
    console.log('API Success Response Body (raw):', rawBody.substring(0, 500)); // Log first 500 chars

    const data: FileListResponse = JSON.parse(rawBody); // Parse the raw text
    console.log('Successfully parsed files data. Count:', data.files?.length || 0);
    return data.files || [];
  } catch (error) {
    // Log the specific error caught during fetch/processing
    console.error('Error caught in getFiles function:', error);
    return [];
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
