# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands
- `pnpm install` - Install dependencies
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run linting
- `pnpm typecheck` - Type checking with TypeScript

### Database Commands
- `pnpm db:generate` - Generate database schema with Drizzle Kit
- `pnpm db:push` - Push database schema changes to Turso/LibSQL

### Debug & Performance Commands
- `pnpm dev:debug` - Start development server with enhanced debugging (DEBUG_MODE=true)
- `pnpm monitor` - Start server with basic performance monitoring
- `pnpm monitor:test` - Start server and run performance tests
- `pnpm monitor:full` - Full monitoring with resource tracking
- `pnpm logs:clean` - Clean up old log files
- `pnpm clean` - Clean build cache and logs
- `pnpm dev:clean` - Clean and start development server

## Architecture Overview

### Core Structure
This is a Next.js 14 application using the App Router pattern with a single-user file sharing system. The architecture is centered around UploadThing for file management and NextAuth.js for authentication.

### Key Directories
- `app/` - Next.js App Router pages and API routes
  - `api/auth/` - NextAuth.js authentication endpoints
  - `api/files/` - File CRUD operations (individual, bulk delete, delete all)
  - `api/uploadthing/` - UploadThing integration and upload handling
  - `f/[slug]/` - File preview pages with metadata
  - `i/[slug]/` - Direct file access redirects for sharing
  - `g/` - Gallery view with pagination
- `components/` - React components with mobile-first design
- `lib/` - Shared utilities and configurations
  - `db/` - Drizzle ORM schema and database connection
  - `auth.ts` - NextAuth configuration with GitHub + credentials providers
  - `logger.ts` - Comprehensive logging system
  - `performance-monitor.ts` - Performance monitoring utilities

### Database Schema
Single `files` table with Drizzle ORM:
- `id` - Primary key (nanoid)
- `filename` - Display name
- `originalName` - Original uploaded name
- `fileKey` - UploadThing file key
- `fileUrl` - UploadThing file URL
- `fileSize` - File size in bytes
- `mimeType` - MIME type for previews
- `slug` - Short URL slug for sharing
- `uploadedAt` - Upload timestamp

### Authentication Flow
Dual authentication system:
1. **GitHub OAuth** - For GitHub users
2. **Credentials** - Username/password from environment variables (ADMIN_USERNAME, ADMIN_PASSWORD)

### File Upload & Management
- **UploadThing** handles file storage and CDN
- **Slug-based URLs** for clean file sharing (`/i/abc123`)
- **Preview system** with different handlers for images, videos, PDFs, etc.
- **Bulk operations** with optimistic UI updates

## Tech Stack

- **Next.js 14** with App Router
- **UploadThing** for file uploads and storage
- **NextAuth.js** for authentication (GitHub + credentials)
- **Drizzle ORM** with Turso/LibSQL database
- **Tailwind CSS** for styling
- **TypeScript** for type safety
- **pnpm** as package manager

## Development Patterns

### State Management
- Server components by default
- Client components for interactive features (file uploads, deletions)
- Optimistic updates for better UX
- No external state management library - uses React state and server actions

### Performance Optimizations
- **Image loading** with timeout handling and retry logic
- **Pagination** for large file collections (20 per page)
- **Lazy loading** for file previews
- **Cache invalidation** without page reloads

### Error Handling
- Comprehensive logging system in `lib/logger.ts`
- Performance monitoring with `lib/performance-monitor.ts`
- Debug mode available with `DEBUG_MODE=true`
- Graceful fallbacks for file previews

## Key Features

- Single-user authentication with dual providers
- Drag-and-drop file upload with real-time progress
- Public file listing accessible without login
- File previews for images, videos, audio, PDFs
- Direct file access via short URLs
- Bulk operations for authenticated users
- Mobile-optimized with swipe gestures
- Performance monitoring and debugging tools