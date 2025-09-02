import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

// Debug endpoint to manually add store bypassing potential connection issues
export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();
    
    if (!username) {
      return NextResponse.json({ error: 'Username required' }, { status: 400 });
    }

    const db = await getDatabase();
    
    // Create table first
    await db.none(`
      CREATE TABLE IF NOT EXISTS admin_stores (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        added_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Insert store with simple query
    const result = await db.one(`
      INSERT INTO admin_stores (username) 
      VALUES ($1) 
      ON CONFLICT (username) DO UPDATE SET username = EXCLUDED.username
      RETURNING id::text, username, added_at::text as "addedAt"
    `, [username]);
    
    return NextResponse.json({ success: true, store: result });
  } catch (error) {
    console.error('Debug add store error:', error);
    return NextResponse.json({ 
      error: 'Failed to add store', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}