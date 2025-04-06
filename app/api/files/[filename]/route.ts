import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { NextRequest } from "next/server";

// Define the R2 Bucket interface again, focusing on delete
interface R2Bucket {
    delete(key: string | string[]): Promise<void>;
    // Add other methods like list, put, get if needed in this context
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: { filename: string } }
) {
    const { filename } = params;

    if (!filename) {
        return Response.json({ error: "Filename parameter is missing" }, { status: 400 });
    }

    // Decode the filename in case it contains URI-encoded characters
    const decodedFilename = decodeURIComponent(filename);

    console.log(`Received DELETE request for file: ${decodedFilename}`);

    const cloudflareContext = getCloudflareContext();
    const R2 = cloudflareContext?.env?.R2_BUCKET as R2Bucket | undefined;

    if (!R2) {
        console.error(`R2_BUCKET binding not found for deleting ${decodedFilename}.`);
        return Response.json({ error: "R2 bucket not configured" }, { status: 500 });
    }

    try {
        await R2.delete(decodedFilename);
        return Response.json({ success: true, deletedFile: decodedFilename });

    } catch (error) {
        console.error(`Error deleting file ${decodedFilename} from R2:`, error);
        const errorMessage = error instanceof Error ? error.message : "Failed to delete file";
        // Check for specific errors if needed (e.g., file not found)
        return Response.json({ error: errorMessage }, { status: 500 });
    }
} 