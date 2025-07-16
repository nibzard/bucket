# Bucket

A simple Next.js application for uploading and sharing files using UploadThing.

## Features

- **Single-user authentication** with username/password
- **Drag-and-drop file upload** with progress indication
- **Public file listing** accessible without login
- **Short slug URLs** for easy sharing (`/f/abc123`)
- **File previews** for images, videos, audio, and PDFs
- **File metadata storage** in SQLite database

## Tech Stack

- **Next.js 14** with App Router
- **UploadThing** for file uploads
- **NextAuth.js** for authentication
- **Drizzle ORM** with SQLite database
- **Tailwind CSS** for styling

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your values:
   - `UPLOADTHING_TOKEN`: Your UploadThing API token
   - `NEXTAUTH_SECRET`: Random secret for NextAuth
   - `ADMIN_USERNAME`: Username for admin access
   - `ADMIN_PASSWORD`: Password for admin access

4. Set up the database:
   ```bash
   npm run db:generate
   npm run db:push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set the following environment variables in Vercel:
   - `UPLOADTHING_TOKEN`
   - `NEXTAUTH_URL` (set to your domain)
   - `NEXTAUTH_SECRET`
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`

4. Deploy!

## Usage

- Visit `/login` to authenticate with your username/password
- Upload files at `/upload` (requires authentication)
- View all files at `/files` (public)
- Access individual files at `/f/{slug}` (public)

## File Types Supported

- Images: up to 16MB
- Videos: up to 256MB
- Audio: up to 64MB
- PDFs: up to 32MB
- Text files: up to 4MB
- Other files: up to 128MB