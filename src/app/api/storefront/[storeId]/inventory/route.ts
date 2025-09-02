import { NextRequest, NextResponse } from 'next/server';
import { withApiInstrumentation, getDevLimitFromEnv } from '@/lib/instrumentation';
import { getInventoryForStore } from '@/server/inventory';

async function handleInventory(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> },
  logger: any,
  tracker: any
) {
  const { storeId: storeUsername } = await params;
  const { searchParams } = request.nextUrl;
  const revalidate = searchParams.get('revalidate') === '1';
  const devLimit = getDevLimitFromEnv(10);
  
  logger.info(`Starting inventory fetch for store: ${storeUsername}${revalidate ? ' (force revalidate)' : ''}`);
  
  // Use shared inventory logic
  const inventoryResult = await getInventoryForStore(storeUsername, {
    revalidate,
    developmentLimit: devLimit,
    logger,
    tracker
  });

  const response = NextResponse.json(inventoryResult);

  // Add instrumentation headers
  const { cacheStats } = inventoryResult;
  response.headers.set('x-cache', cacheStats.stale ? 'STALE' : 'FRESH');
  response.headers.set('x-refresh', cacheStats.stale ? 'background' : 'synchronous');
  response.headers.set('x-cache-hit-rate', `${cacheStats.cacheHitRate}%`);
  response.headers.set('x-feed-dev-limit', devLimit.toString());

  return response;
}

export const GET = withApiInstrumentation(handleInventory);