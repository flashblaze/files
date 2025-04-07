# File Uploader

This is a simple file uploader built with Next.js, Shadcn, and Lucide.

## Getting Started

1. Create a public R2 bucket and give it a custom domain
2. Edit the CORS policy like so:
```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://files.flashblaze.dev"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3600
  }
]
```
3. Clone the repository and create a `.env` file from `.env.example`
4. Follow [API Token](https://developers.cloudflare.com/r2/api/tokens/) to create access key and secret key
5. Replace the variables in the `.env` file with your own
6. Install dependencies via `bun i`
7. Run the development server via `bun dev`
8. Put the main domain behind Cloudflare Access so you only can access and you're good to go!
