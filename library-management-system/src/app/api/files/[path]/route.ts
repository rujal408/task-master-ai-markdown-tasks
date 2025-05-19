import { NextResponse } from 'next/server';
import { deleteFile } from '@/lib/file-upload';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function DELETE(
  req: Request,
  { params }: { params: { path: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the file path from the URL parameters
    const path = params.path;
    
    if (!path) {
      return NextResponse.json({ success: false, error: 'File path is required' }, { status: 400 });
    }
    
    // Delete the file
    const success = await deleteFile(path);
    
    if (!success) {
      return NextResponse.json({ success: false, error: 'Failed to delete file' }, { status: 400 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('File deletion error:', error);
    return NextResponse.json({ success: false, error: 'File deletion failed' }, { status: 500 });
  }
}

// Config for Next.js route handlers
export const dynamic = 'force-dynamic';
