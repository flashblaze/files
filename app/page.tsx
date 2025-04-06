'use client';

import { useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';

// Define a type for the API response
type ApiResponse = {
  success: boolean;
  fileName?: string;
  error?: string;
};

const Home = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isError, setIsError] = useState<boolean>(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files ? e.target.files[0] : null;
    setFile(selectedFile);
    setStatusMessage(''); // Clear status on new file selection
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
      const response = await fetch('/api', {
        // Assuming your API route is at /api
        method: 'POST',
        body: formData,
      });

      // Use the ApiResponse type
      const result: ApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to upload file.');
      }

      setStatusMessage(`Successfully uploaded ${result.fileName}!`);
      setFile(null); // Clear file input after successful upload
      const fileInput = document.getElementById('fileInput') as HTMLInputElement;
      if (fileInput) fileInput.value = ''; // Reset file input visually
    } catch (error) {
      console.error('Upload error:', error);
      setStatusMessage(error instanceof Error ? error.message : 'An unknown error occurred.');
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center font-bold text-2xl text-gray-700">Upload File to R2</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="fileInput" className="mb-1 block font-medium text-gray-600 text-sm">
              Choose File
            </label>
            <input
              id="fileInput"
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
              <svg
                className="-ml-1 mr-3 h-5 w-5 animate-spin text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <title>Loading</title>
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
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
};

export default Home;
