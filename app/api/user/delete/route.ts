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

    console.log('Starting account deletion process for user:', userId);
    
    // Create the admin client
    const supabaseAdmin = createAdminClient();

    // Step 2: Soft delete the profile in public.users
    console.log('Soft-deleting user profile in public.users...');
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .update({
        deleted_at: new Date().toISOString(),
        is_deleted: true,
        // Optionally clear other PII here if desired
        // email: null, 
        // full_name: null,
      })
      .eq('id', userId);

    if (profileError) {
      // Log the error, but the user is already banned, which is the primary goal
      console.error('Profile soft-delete error:', profileError);
      // We might still return success here as the account is effectively blocked
      // Or return a specific error indicating partial failure
      // Let's return success but log the error server-side
      return NextResponse.json(
        { error: 'Failed to soft-delete user profile', details: profileError.message },
        { status: 500 }
      );
    }
    console.log('Profile soft-deleted successfully.');

    console.log('Account deletion process completed successfully for user:', userId);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in account deletion process:', error);
    return NextResponse.json(
      {
        error: 'Failed to process account deletion',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});