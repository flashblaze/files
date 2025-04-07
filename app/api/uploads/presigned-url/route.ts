import { getCloudflareContext } from '@opennextjs/cloudflare';
// Import aws4fetch instead of AWS SDK
import { AwsClient } from 'aws4fetch';
import type { NextRequest } from 'next/server';

// Type for the expected request body
interface PresignedUrlRequestBody {
  filename: string;
  contentType: string;
}

export async function POST(request: NextRequest) {
  let requestBody: PresignedUrlRequestBody;
  try {
    requestBody = await request.json();
  } catch (e) {
    console.error('API AWS4FETCH PRESIGNED: Failed to parse request body:', e);
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { filename, contentType } = requestBody;

  if (
    !filename ||
    typeof filename !== 'string' ||
    !contentType ||
    typeof contentType !== 'string'
  ) {
    console.error('API AWS4FETCH PRESIGNED: Missing or invalid filename/contentType', requestBody);
    return Response.json({ error: 'Missing or invalid filename/contentType' }, { status: 400 });
  }

  const objectKey = filename;

  try {
    // Get Cloudflare environment context
    const cloudflareContext = await getCloudflareContext({ async: true });
    // Cast to any first, then to Env
    const env = cloudflareContext?.env;

    if (
      !env?.NEXT_PUBLIC_R2_ACCOUNT_ID ||
      !process.env.R2_ACCESS_KEY_ID ||
      !process.env.R2_SECRET_ACCESS_KEY ||
      !env?.NEXT_PUBLIC_R2_BUCKET_NAME
    ) {
      console.error('API AWS4FETCH PRESIGNED: Missing required R2 environment variables/secrets.');
      throw new Error('Server configuration error: R2 credentials missing.');
    }

    // Create AwsClient instance with actual credentials from env
    const r2 = new AwsClient({
      accessKeyId: process.env.R2_ACCESS_KEY_ID || '', // Use env variable
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '', // Use env variable
    });

    // Construct the target URL using env variables
    const targetUrl = new URL(
      `https://${env.NEXT_PUBLIC_R2_BUCKET_NAME}.${env.NEXT_PUBLIC_R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${objectKey}`
    );

    // Specify expiry
    const expiresInSeconds = 3600; // 1 hour
    targetUrl.searchParams.set('X-Amz-Expires', expiresInSeconds.toString());

    // Sign the request
    const signedRequest = await r2.sign(targetUrl.toString(), {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
      },
      aws: { signQuery: true },
    });

    const presignedUrl = signedRequest.url;

    return Response.json({ url: presignedUrl, method: 'PUT' });
  } catch (error) {
    console.error(
      `API AWS4FETCH PRESIGNED: Error generating pre-signed URL for ${objectKey}:`,
      error
    );
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to generate pre-signed URL';
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
