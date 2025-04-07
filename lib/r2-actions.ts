import { getCloudflareContext } from '@opennextjs/cloudflare';

// Define necessary R2 interfaces (copied from api/files/route.ts)
interface R2Object {
  key: string;
  version: string;
  size: number;
  etag: string;
  httpEtag: string;
  uploaded: Date;
  httpMetadata?: R2HTTPMetadata;
  customMetadata?: Record<string, string>;
}

interface R2HTTPMetadata {
  contentType?: string;
}

interface R2ListOptions {
  limit?: number;
  prefix?: string;
  cursor?: string;
  delimiter?: string;
  include?: Array<'httpMetadata' | 'customMetadata'>;
}

interface R2Objects {
  objects: R2Object[];
  truncated: boolean;
  cursor?: string;
  delimitedPrefixes: string[];
}

interface R2Bucket {
  list(options?: R2ListOptions): Promise<R2Objects>;
}

// Define the structure of the file data we want to return
export interface R2ListedFile {
  name: string;
  type: string;
  size: number;
  uploaded: string; // Return ISO string for serializability
}

// Function to contain the core R2 listing logic
export async function listFilesFromR2(): Promise<R2ListedFile[]> {
  // Use async mode to get Cloudflare context
  const cloudflareContext = await getCloudflareContext({ async: true });

  const R2 = cloudflareContext?.env?.R2_BUCKET as R2Bucket | undefined;

  if (!R2) {
    console.error('R2 ACTION: R2_BUCKET binding not found.');
    // Throw an error that can be caught by the caller
    throw new Error('R2 bucket not configured');
  }

  try {
    const listed = await R2.list({ include: ['httpMetadata'] });

    const files: R2ListedFile[] = listed.objects.map((obj) => ({
      name: obj.key,
      type: obj.httpMetadata?.contentType || 'unknown',
      size: obj.size,
      uploaded: obj.uploaded?.toISOString(), // Ensure date is ISO string
    }));

    return files;
  } catch (error) {
    console.error('R2 ACTION: Error during R2 list operation:', error);
    // Re-throw the error to be handled by the caller
    throw new Error(error instanceof Error ? error.message : 'Failed to list files from R2');
  }
}
