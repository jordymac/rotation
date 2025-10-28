import { NextRequest, NextResponse } from 'next/server';
import { adminStores } from '@/lib/storage';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // TODO: Add authentication when implementing Discogs OAuth (Phase 2)

  try {
    const { id } = await params;
    
    const success = adminStores.remove(id);
    
    if (!success) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing store:', error);
    return NextResponse.json({ error: 'Failed to remove store' }, { status: 500 });
  }
}
