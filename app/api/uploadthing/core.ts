import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db, files } from "@/lib/db";
import { nanoid } from "nanoid";

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
      const slug = nanoid(8);
      
      await db.insert(files).values({
        filename: file.name,
        originalName: file.name,
        fileKey: file.key,
        fileUrl: file.url,
        fileSize: file.size,
        mimeType: file.type,
        slug,
      });

      return { 
        uploadedBy: metadata.userId,
        slug,
        url: file.url 
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;