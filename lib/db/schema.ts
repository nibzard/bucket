import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { nanoid } from "nanoid";

export const files = sqliteTable("files", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  fileKey: text("file_key").notNull().unique(),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  slug: text("slug").notNull().unique(),
  uploadedAt: integer("uploaded_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});