import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { NextRequest } from "next/server";

// Re-use or define necessary R2 interfaces
interface R2Object {
    key: string;
    version: string;
    size: number;
    etag: string;
    httpEtag: string;
    uploaded: Date;
    httpMetadata?: R2HTTPMetadata;
    customMetadata?: Record<string, string>;
    // Add other properties if needed based on R2 documentation
}

interface R2HTTPMetadata {
    contentType?: string;
    // Add other standard HTTP headers if used
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
    // Add other methods like get, put, delete if needed
}


export async function GET(_request: NextRequest) {
    console.log("Received GET request for files");
    const cloudflareContext = getCloudflareContext();
    const R2 = cloudflareContext?.env?.R2_BUCKET as R2Bucket | undefined;

    console.log("R2 Binding for list:", R2 ? "Found" : "Not Found");

    if (!R2) {
        console.error("R2_BUCKET binding not found for listing.");
        return Response.json({ error: "R2 bucket not configured" }, { status: 500 });
    }

    try {
        console.log("Attempting to list objects from R2...");
        // Fetch objects including their HTTP metadata to get content type
        const listed = await R2.list({ include: ['httpMetadata'] });

        console.log(`Found ${listed.objects.length} objects. Truncated: ${listed.truncated}`);

        const files = listed.objects.map(obj => ({
            name: obj.key,
            type: obj.httpMetadata?.contentType || 'unknown', // Extract content type
            size: obj.size,
            uploaded: obj.uploaded,
        }));

        return Response.json({ files });

    } catch (error) {
        console.error("Error listing files from R2:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to list files";
        return Response.json({ error: errorMessage }, { status: 500 });
    }
} 