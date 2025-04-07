import { listFilesFromR2 } from '@/lib/r2-actions';
import type { NextRequest } from 'next/server';

export async function GET(_request: NextRequest) {
  try {
    const files = await listFilesFromR2();
    return Response.json({ files });
  } catch (error) {
    console.error('API ROUTE: Error calling listFilesFromR2:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to list files';
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
