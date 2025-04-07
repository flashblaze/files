import { getCloudflareContext } from '@opennextjs/cloudflare';
import type { NextRequest } from 'next/server';

interface R2Bucket {
  delete(key: string | string[]): Promise<void>;
}

export async function DELETE(_request: NextRequest, context: any) {
  const params = context?.params;
  const filename = params?.filename as string | undefined;

  if (!filename || typeof filename !== 'string') {
    console.error('Invalid or missing filename parameter in context:', context);
    return Response.json({ error: 'Invalid filename parameter' }, { status: 400 });
  }

  const decodedFilename = decodeURIComponent(filename);

  const cloudflareContext = getCloudflareContext();
  const R2 = cloudflareContext?.env?.R2_BUCKET as R2Bucket | undefined;

  if (!R2) {
    console.error(`R2_BUCKET binding not found for deleting ${decodedFilename}.`);
    return Response.json({ error: 'R2 bucket not configured' }, { status: 500 });
  }

  try {
    await R2.delete(decodedFilename);
    return Response.json({ success: true, deletedFile: decodedFilename });
  } catch (error) {
    console.error(`Error deleting file ${decodedFilename} from R2:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete file';
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
