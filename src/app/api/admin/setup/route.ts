import { NextRequest, NextResponse } from 'next/server';
import { runMigrations, testDatabaseConnection } from '@/lib/db';

// POST /api/admin/setup
// Run database migrations and setup
export async function POST(request: NextRequest) {
  try {
    console.log('[Setup] Starting database setup...');
    
    // Test database connection
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }
    
    // Run migrations
    await runMigrations();
    
    console.log('[Setup] Database setup completed successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Database setup completed successfully'
    });
    
  } catch (error) {
    console.error('[Setup] Database setup failed:', error);
    return NextResponse.json(
      { 
        error: 'Database setup failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// GET /api/admin/setup
// Check database and Redis status
export async function GET(request: NextRequest) {
  try {
    const dbConnected = await testDatabaseConnection();
    
    // Test Redis connection
    let redisConnected = false;
    try {
      const { testRedisConnection } = await import('@/lib/redis');
      redisConnected = await testRedisConnection();
    } catch (error) {
      console.error('[Setup] Redis test failed:', error);
    }
    
    return NextResponse.json({
      success: true,
      status: {
        database: dbConnected,
        redis: redisConnected,
        ready: dbConnected && redisConnected
      }
    });
    
  } catch (error) {
    console.error('[Setup] Status check failed:', error);
    return NextResponse.json(
      { 
        error: 'Status check failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}