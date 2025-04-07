import { getCloudflareContext } from '@opennextjs/cloudflare';
import { AwsClient } from 'aws4fetch';
import type { NextRequest } from 'next/server';

interface PresignedUrlRequestBody {
  fileName: string;
  expiresInMinutes: number;
}

// Validate that the expiration is within reasonable bounds (e.g., 1 minute to 7 days)
// R2 default/max is 7 days (604800 seconds)
const MIN_EXPIRATION_MINUTES = 1;
const MAX_EXPIRATION_MINUTES = 7 * 24 * 60; // 7 days in minutes

export async function POST(request: NextRequest) {
  let requestBody: PresignedUrlRequestBody;
  try {
    requestBody = await request.json();
  } catch (e) {
    console.error('API Generate Temp URL: Failed to parse request body:', e);
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { fileName, expiresInMinutes } = requestBody;

  if (
    !fileName ||
    typeof fileName !== 'string' ||
    !expiresInMinutes ||
    typeof expiresInMinutes !== 'number' ||
    expiresInMinutes < MIN_EXPIRATION_MINUTES ||
    expiresInMinutes > MAX_EXPIRATION_MINUTES
  ) {
    console.error(
      'API Generate Temp URL: Missing or invalid fileName/expiresInMinutes',
      requestBody
    );
    return Response.json(
      {
        error: `Missing or invalid fileName/expiresInMinutes. Expiration must be between ${MIN_EXPIRATION_MINUTES} and ${MAX_EXPIRATION_MINUTES} minutes.`,
      },
      { status: 400 }
    );
  }

  const objectKey = fileName; // Assuming filename includes any necessary path
  const expiresInSeconds = expiresInMinutes * 60;

  try {
    const cloudflareContext = await getCloudflareContext({ async: true });
    const env = cloudflareContext?.env;

    if (
      !env?.NEXT_PUBLIC_R2_ACCOUNT_ID ||
      !process.env.R2_ACCESS_KEY_ID ||
      !process.env.R2_SECRET_ACCESS_KEY ||
      !env?.NEXT_PUBLIC_R2_BUCKET_NAME
    ) {
      console.error('API Generate Temp URL: Missing required R2 environment variables/secrets.');
      throw new Error('Server configuration error: R2 credentials missing.');
    }

    const r2 = new AwsClient({
      accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
      service: 's3', // Important: Specify service as 's3'
    });

    const targetUrl = new URL(
      `https://${env.NEXT_PUBLIC_R2_BUCKET_NAME}.${env.NEXT_PUBLIC_R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${objectKey}`
    );

    // Add the expiration time as a query parameter *before* signing
    targetUrl.searchParams.set('X-Amz-Expires', expiresInSeconds.toString());

    const signedRequest = await r2.sign(targetUrl.toString(), {
      method: 'GET', // Use GET for accessing the file
      aws: {
        signQuery: true, // Sign the query parameters
        allHeaders: true, // Ensure all necessary headers are signed if needed (usually not for GET)
      },
    });

    const presignedUrl = signedRequest.url;

    return Response.json({ url: presignedUrl });
  } catch (error) {
    console.error(
      `API Generate Temp URL: Error generating pre-signed GET URL for ${objectKey}:`,
      error
    );
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to generate temporary URL';
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
