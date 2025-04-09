import type { ActionFunctionArgs } from 'react-router';

export async function action({ context, params }: ActionFunctionArgs) {
  const filename = params?.name as string | undefined;

  if (!filename || typeof filename !== 'string') {
    console.error('Invalid or missing filename parameter in context:', context);
    return Response.json({ error: 'Invalid filename parameter' }, { status: 400 });
  }

  const decodedFilename = decodeURIComponent(filename);

  const R2 = context?.cloudflare.env.R2_BUCKET;

  try {
    await R2.delete(decodedFilename);
    return Response.json({ success: true, deletedFile: decodedFilename });
  } catch (error) {
    console.error(`Error deleting file ${decodedFilename} from R2:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete file';
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
