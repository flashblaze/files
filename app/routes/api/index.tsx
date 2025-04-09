import type { ActionFunctionArgs } from 'react-router';

// app/routes/api.tsx
export async function action({ request, context }: ActionFunctionArgs) {
  // Use type assertion for the R2 binding
  const R2 = context?.cloudflare.env.R2_BUCKET as R2Bucket | undefined;

  if (!R2) {
    console.error('R2_BUCKET binding not found.');
    return Response.json({ error: 'R2 bucket not configured' }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      console.error('No file found in FormData.');
      return Response.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // --- Actual R2 Upload Logic ---
    const fileKey = file.name; // Use filename as the key, consider adding prefix/UUID for uniqueness
    const fileBuffer = await file.arrayBuffer();

    const uploadedObject = await R2.put(fileKey, fileBuffer, {
      httpMetadata: { contentType: file.type },
    });

    return Response.json({ success: true, fileName: file.name, etag: uploadedObject.httpEtag });
  } catch (error) {
    console.error('Error handling file upload:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process file upload';
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
