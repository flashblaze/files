import { env } from 'cloudflare:workers';
import { AwsClient } from 'aws4fetch';
import type { ActionFunctionArgs } from 'react-router';

interface PresignedUrlRequestBody {
  filename: string;
  contentType: string;
}

export async function action({ request, context }: ActionFunctionArgs) {
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
    if (
      !env.PUBLIC_R2_ACCOUNT_ID ||
      !env.R2_ACCESS_KEY_ID ||
      !env.R2_SECRET_ACCESS_KEY ||
      !env.PUBLIC_R2_BUCKET_NAME
    ) {
      console.error('API AWS4FETCH PRESIGNED: Missing required R2 environment variables/secrets.');
      throw new Error('Server configuration error: R2 credentials missing.');
    }

    const r2 = new AwsClient({
      accessKeyId: env.R2_ACCESS_KEY_ID || '',
      secretAccessKey: env.R2_SECRET_ACCESS_KEY || '',
    });

    const targetUrl = new URL(
      `https://${env.PUBLIC_R2_BUCKET_NAME}.${env.PUBLIC_R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${objectKey}`
    );

    const expiresInSeconds = 3600;
    targetUrl.searchParams.set('X-Amz-Expires', expiresInSeconds.toString());

    // This is to simulate R2 file upload in development mode
    if (env.PUBLIC_MODE === 'development') {
      // Or create an ArrayBuffer with some content
      const contentBuffer = new ArrayBuffer(8);
      const view = new Uint8Array(contentBuffer);
      view.fill(0); // Fill with zeros or any other data

      // Store the placeholder in R2
      await context.cloudflare.env.R2_BUCKET.put(`${new Date().toISOString()}.txt`, contentBuffer, {
        customMetadata: {
          type: 'placeholder',
          createdAt: new Date().toISOString(),
        },
      });
    }

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
