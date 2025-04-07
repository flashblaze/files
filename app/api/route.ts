import { getCloudflareContext } from '@opennextjs/cloudflare';
import type { NextRequest } from 'next/server';

// Define the R2 Bucket interface (optional but good practice)
interface R2Bucket {
  put(
    key: string,
    value: ArrayBuffer | ReadableStream | string | null,
    options?: R2PutOptions
  ): Promise<R2Object>;
  // Add other methods like get, delete if needed
}

interface R2PutOptions {
  httpMetadata?: R2HTTPMetadata;
  customMetadata?: Record<string, string>;
  // Add other options like md5, etc.
}

interface R2HTTPMetadata {
  contentType?: string;
  // Add other standard HTTP headers
}

interface R2Object {
  // Define properties of the returned R2 object if needed
  key: string;
  version: string;
  size: number;
  etag: string;
  httpEtag: string;
  // ... and so on
}

export async function POST(request: NextRequest) {
  const cloudflareContext = getCloudflareContext();
  // Use type assertion for the R2 binding
  const R2 = cloudflareContext?.env?.R2_BUCKET as R2Bucket | undefined;

  if (!R2) {
    console.error('R2_BUCKET binding not found.');
    return Response.json({ error: 'R2 bucket not configured' }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      console.error('No file found in FormData.');
      return Response.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // --- Actual R2 Upload Logic ---
    const fileKey = file.name; // Use filename as the key, consider adding prefix/UUID for uniqueness
    const fileBuffer = await file.arrayBuffer();

    const uploadedObject = await R2.put(fileKey, fileBuffer, {
      httpMetadata: { contentType: file.type },
    });

    return Response.json({ success: true, fileName: file.name, etag: uploadedObject.httpEtag });
  } catch (error) {
    console.error('Error handling file upload:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process file upload';
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}

// Remove the old GET handler if it exists
// export async function GET() { ... }
