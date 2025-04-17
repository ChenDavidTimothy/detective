import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createAdminClient } from '@/utils/supabase/supabase-admin';
import { withCors } from '@/utils/cors';

export const DELETE = withCors(async function DELETE(request: NextRequest) {
  try {
    const userId = new URL(request.url).searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log('Starting account soft-deletion for user:', userId);
    
    // Create the admin client
    const supabaseAdmin = createAdminClient();

    // Soft delete the profile
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .update({
        deleted_at: new Date().toISOString(),
        is_deleted: true,
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Profile update error:', profileError);
      return NextResponse.json(
        { error: 'Failed to update profile', details: profileError.message },
        { status: 500 }
      );
    }

    console.log('Account soft-deletion completed successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in account soft-deletion:', error);
    return NextResponse.json(
      {
        error: 'Failed to process account deletion',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});