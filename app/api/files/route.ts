import type { NextRequest } from 'next/server';
import { listFilesFromR2 } from '../../../lib/r2-actions'; // Adjust path as needed

export async function GET(_request: NextRequest) {
  try {
    const files = await listFilesFromR2();
    // Log success from API route perspective
    return Response.json({ files });
  } catch (error) {
    // Log the error caught from the shared function
    console.error('API ROUTE: Error calling listFilesFromR2:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to list files';
    // Return the error status based on the shared function's throw
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}

// Remove the unused R2 interfaces and direct R2 access logic from this file
