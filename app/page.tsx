import { db, files } from "@/lib/db";
import { desc, count } from "drizzle-orm";
import { HomePage } from "@/components/HomePage";

async function getFiles(page: number = 1, limit: number = 20) {
  const offset = (page - 1) * limit;
  
  const [filesList, totalCountResult] = await Promise.all([
    db
      .select()
      .from(files)
      .orderBy(desc(files.uploadedAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(files)
  ]);

  return {
    files: filesList,
    totalCount: totalCountResult[0].count
  };
}

export default async function Page({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const currentPage = parseInt(searchParams.page || '1');
  const { files: allFiles, totalCount } = await getFiles(currentPage);

  return <HomePage initialFiles={allFiles} totalCount={totalCount} currentPage={currentPage} />;
}