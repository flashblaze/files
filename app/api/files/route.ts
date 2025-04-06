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
    console.log("API ROUTE: Received GET request for files"); // Identify log source
    const cloudflareContext = getCloudflareContext();
    const R2 = cloudflareContext?.env?.R2_BUCKET as R2Bucket | undefined;

    console.log("API ROUTE: R2 Binding found:", !!R2); // Log boolean check

    if (!R2) {
        console.error("API ROUTE: R2_BUCKET binding not found.");
        return Response.json({ error: "R2 bucket not configured" }, { status: 500 });
    }

    try {
        console.log("API ROUTE: Attempting R2 list operation...");
        const listed = await R2.list({ include: ['httpMetadata'] });
        console.log(`API ROUTE: R2 list operation successful. Objects found: ${listed.objects.length}, Truncated: ${listed.truncated}`);

        const files = listed.objects.map(obj => ({
            name: obj.key,
            type: obj.httpMetadata?.contentType || 'unknown',
            size: obj.size,
            uploaded: obj.uploaded?.toISOString(), // Ensure date is serializable
        }));

        // Log first few file names if successful
        if (files.length > 0) {
            console.log("API ROUTE: Sample files returned:", files.slice(0, 3).map(f => f.name));
        }

        return Response.json({ files });

    } catch (error) {
        // Log the specific error from R2.list()
        console.error("API ROUTE: Error during R2 list operation:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to list files";
        return Response.json({ error: errorMessage }, { status: 500 });
    }
} 