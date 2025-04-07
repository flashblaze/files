import { getCloudflareContext } from '@opennextjs/cloudflare';
import { AwsClient } from 'aws4fetch';
import type { NextRequest } from 'next/server';

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
    const cloudflareContext = await getCloudflareContext({ async: true });
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

    const r2 = new AwsClient({
      accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    });

    const targetUrl = new URL(
      `https://${env.NEXT_PUBLIC_R2_BUCKET_NAME}.${env.NEXT_PUBLIC_R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${objectKey}`
    );

    const expiresInSeconds = 3600;
    targetUrl.searchParams.set('X-Amz-Expires', expiresInSeconds.toString());

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
