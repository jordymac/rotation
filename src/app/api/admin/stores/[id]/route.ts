import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { adminStores } from '@/lib/storage';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Temporarily bypass auth for development
  // const { userId } = await auth();
  // 
  // if (!userId) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

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
