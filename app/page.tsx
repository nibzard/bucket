import { db, files } from "@/lib/db";
import { desc, count } from "drizzle-orm";
import { HomePage } from "@/components/HomePage";
import { serverLogger } from "@/lib/logger";

// Force dynamic rendering to avoid cache issues
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getFiles(page: number = 1, limit: number = 20) {
  const startTime = Date.now();
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

  const queryTime = Date.now() - startTime;
  serverLogger.info('Homepage data fetch', {
    page,
    limit,
    offset,
    filesCount: filesList.length,
    totalCount: totalCountResult[0].count,
    queryTime: `${queryTime}ms`,
    timestamp: Date.now(),
    performanceNote: queryTime > 1000 ? 'SLOW_QUERY' : 'NORMAL'
  });
  
  if (queryTime > 1000) {
    serverLogger.warn('Slow database query detected', {
      operation: 'getFiles',
      page,
      queryTime: `${queryTime}ms`,
      threshold: '1000ms'
    });
  }

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