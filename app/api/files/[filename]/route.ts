import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { NextRequest } from "next/server";

// Define the R2 Bucket interface again, focusing on delete
interface R2Bucket {
    delete(key: string | string[]): Promise<void>;
    // Add other methods like list, put, get if needed in this context
}

// Use 'any' for the second argument type as a workaround
export async function DELETE(
    _request: NextRequest,
    context: any // Type context as 'any'
) {
    // Runtime check for params and filename
    const params = context?.params;
    const filename = params?.filename as string | undefined;

    if (!filename || typeof filename !== 'string') {
        console.error("Invalid or missing filename parameter in context:", context);
        return Response.json({ error: "Invalid filename parameter" }, { status: 400 });
    }

    const decodedFilename = decodeURIComponent(filename);

    console.log(`Received DELETE request for file: ${decodedFilename}`);

    const cloudflareContext = getCloudflareContext();
    const R2 = cloudflareContext?.env?.R2_BUCKET as R2Bucket | undefined;

    if (!R2) {
        console.error(`R2_BUCKET binding not found for deleting ${decodedFilename}.`);
        return Response.json({ error: "R2 bucket not configured" }, { status: 500 });
    }

    try {
        console.log(`Attempting to delete ${decodedFilename} from R2...`);
        await R2.delete(decodedFilename);
        console.log(`Successfully deleted ${decodedFilename} from R2.`);
        return Response.json({ success: true, deletedFile: decodedFilename });

    } catch (error) {
        console.error(`Error deleting file ${decodedFilename} from R2:`, error);
        const errorMessage = error instanceof Error ? error.message : "Failed to delete file";
        // Check for specific errors if needed (e.g., file not found)
        return Response.json({ error: errorMessage }, { status: 500 });
    }
} 