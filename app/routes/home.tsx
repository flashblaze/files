import { env } from 'cloudflare:workers';
import FileCard from '~/components/FileCard';
import FileUploader from '~/components/FileUploader';
import type { Route } from './+types/home';

export function meta() {
  return [{ title: 'File Uploader' }, { name: 'description', content: 'Share files with ease' }];
}

export async function loader({ context }: Route.LoaderArgs) {
  const R2 = context?.cloudflare.env.R2_BUCKET;

  const listed = await R2.list({ include: ['httpMetadata'] });

  const files = listed.objects.map((obj) => ({
    name: obj.key,
    type: obj.httpMetadata?.contentType || 'unknown',
    size: obj.size,
    uploaded: obj.uploaded?.toISOString(), // Ensure date is ISO string
  }));

  // Sort files by upload date in descending order (newest first)
  const sortedFiles = files.sort((a, b) => {
    const dateA = new Date(a.uploaded || 0);
    const dateB = new Date(b.uploaded || 0);
    return dateB.getTime() - dateA.getTime(); // Descending order
  });

  return { files: sortedFiles, publicR2Url: env.PUBLIC_R2_URL };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <div className="container mx-auto min-h-screen p-8">
      <header className="mb-8 flex items-center justify-between border-b pb-4">
        <h1 className="font-bold text-2xl tracking-tight">Your Files</h1>
        <FileUploader />
      </header>

      <main>
        {loaderData.files.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-lg border-2 border-gray-300 border-dashed">
            <p className="text-center text-gray-500">No files found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {loaderData.files.map((file) => (
              <FileCard key={file.name} file={file} publicR2Url={loaderData.publicR2Url} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
