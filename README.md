# Bucket

A simple, clean Next.js application for uploading and sharing files using UploadThing.

## Features

### Core Functionality
- **Single-user authentication** with username/password stored in environment variables
- **Drag-and-drop file upload** with real-time progress indication and success feedback
- **Public file listing** on homepage - accessible without login
- **Direct file access** via short URLs (`/i/abc123`) that redirect to file content
- **File previews** for images, videos, audio, and PDFs with clean viewing interface
- **File metadata storage** in SQLite database with upload timestamps

### User Experience
- **Unified homepage** - file listing and upload in one place
- **Compact file cards** with clickable file names for viewing
- **Pagination** for large file collections (20 files per page)
- **Silent link copying** - no interrupting alerts
- **Responsive design** with Tailwind CSS

### File Management (Authenticated Users)
- **Individual file deletion** with confirmation
- **Bulk selection** with checkboxes and "Select all on page" option
- **Bulk delete** for selected files
- **Delete all files** nuclear option for complete cleanup
- **Real-time file operations** with loading states

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
   - `NEXTAUTH_SECRET`: Generate a random secret using: `openssl rand -base64 32`
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
   - `NEXTAUTH_URL` (set to your domain, e.g., https://your-app.vercel.app)
   - `NEXTAUTH_SECRET` (generate using: `openssl rand -base64 32`)
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`

4. Deploy!

## Usage

- **Homepage (`/`)**: View all files publicly, upload files if logged in
- **Login (`/login`)**: Authenticate with username/password
- **File view (`/f/{slug}`)**: View individual files with metadata and previews
- **Direct access (`/i/{slug}`)**: Direct redirect to file content for sharing/embedding

## File Types Supported

- **Images**: up to 16MB (JPEG, PNG, WebP, etc.)
- **Videos**: up to 256MB (MP4, WebM, etc.)
- **Audio**: up to 64MB (MP3, WAV, etc.)
- **PDFs**: up to 32MB
- **Text files**: up to 4MB
- **Other files**: up to 128MB (any file type)

## API Endpoints

### File Operations
- `GET /api/files/[id]` - Get file metadata
- `DELETE /api/files/[id]` - Delete individual file (auth required)
- `POST /api/files/bulk-delete` - Delete multiple files (auth required)
- `POST /api/files/delete-all` - Delete all files (auth required)

### File Access
- `GET /i/[slug]` - Direct redirect to file content
- `GET /f/[slug]` - File preview page with metadata

### Upload
- `POST /api/uploadthing` - File upload endpoint (auth required)

## Project Structure

```
bucket/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/     # NextAuth.js authentication
│   │   ├── files/                 # File management endpoints
│   │   └── uploadthing/           # UploadThing integration
│   ├── f/[slug]/                  # File preview pages
│   ├── i/[slug]/                  # Direct file access redirects
│   ├── login/                     # Login page
│   └── page.tsx                   # Homepage with file listing
├── components/
│   ├── Header.tsx                 # Navigation header
│   ├── HomePage.tsx               # Main file listing and upload
│   ├── Pagination.tsx             # Pagination controls
│   └── *Button.tsx                # Various utility buttons
├── lib/
│   ├── auth.ts                    # NextAuth configuration
│   ├── db/                        # Database schema and connection
│   └── uploadthing.ts             # UploadThing client setup
└── drizzle/                       # Database migrations
```