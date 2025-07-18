import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db, files } from "@/lib/db";
import { nanoid } from "nanoid";
import { serverLogger } from "@/lib/logger";
import { revalidatePath } from "next/cache";

const f = createUploadthing();

export const ourFileRouter = {
  fileUploader: f({
    image: { maxFileSize: "16MB", maxFileCount: 10 },
    video: { maxFileSize: "256MB", maxFileCount: 5 },
    audio: { maxFileSize: "64MB", maxFileCount: 10 },
    pdf: { maxFileSize: "32MB", maxFileCount: 10 },
    text: { maxFileSize: "4MB", maxFileCount: 20 },
    blob: { maxFileSize: "128MB", maxFileCount: 5 },
  })
    .middleware(async ({ req }) => {
      const session = await getServerSession(authOptions);
      
      if (!session) {
        throw new UploadThingError("Unauthorized");
      }

      return { userId: (session.user as any).id || "admin" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const startTime = Date.now();
      const slug = nanoid(8);
      
      serverLogger.info('Upload complete callback started', {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        fileKey: file.key,
        slug,
        userId: metadata.userId
      });
      
      try {
        // Insert into database
        const dbStartTime = Date.now();
        await db.insert(files).values({
          filename: file.name,
          originalName: file.name,
          fileKey: file.key,
          fileUrl: file.ufsUrl,
          fileSize: file.size,
          mimeType: file.type,
          slug,
        });
        
        const dbInsertTime = Date.now() - dbStartTime;
        serverLogger.info('File inserted into database', {
          slug,
          fileName: file.name,
          dbInsertTime: `${dbInsertTime}ms`
        });
        
        // Invalidate Next.js cache for pages that show file listings
        revalidatePath('/');
        revalidatePath('/g');
        revalidatePath('/files');
        
        serverLogger.info('Cache invalidation triggered', {
          slug,
          paths: ['/', '/g', '/files']
        });
        
        const totalTime = Date.now() - startTime;
        serverLogger.info('Upload complete callback finished', {
          slug,
          fileName: file.name,
          totalTime: `${totalTime}ms`,
          success: true
        });

        return { 
          uploadedBy: metadata.userId,
          slug,
          url: file.ufsUrl 
        };
      } catch (error) {
        const totalTime = Date.now() - startTime;
        serverLogger.error('Upload complete callback failed', error as Error, {
          slug,
          fileName: file.name,
          totalTime: `${totalTime}ms`,
          fileKey: file.key
        });
        throw error;
      }
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;