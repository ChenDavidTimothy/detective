import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createAdminClient } from '@/utils/supabase/supabase-admin';
import { withCors } from '@/utils/cors';

export const POST = withCors(async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminClient();

    // Check for the exact email in auth.users (using admin API)
    try {
      const { data: authData, error: authError } =
        await supabaseAdmin.auth.admin.listUsers();

      if (!authError && authData?.users) {
        const exactMatch = authData.users.find(
          user => user.email?.toLowerCase() === email.toLowerCase()
        );

        if (exactMatch) {
          return NextResponse.json({
            exists: true,
            provider: exactMatch.app_metadata?.provider || 'email',
          });
        }
      }
    } catch (authCheckError) {
      console.error('Auth check error:', authCheckError);
      // Fallback to public.users check
    }

    // Fallback: check public.users table with exact email match
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .limit(1);

    if (error) {
      console.error('Email check error:', error);
      return NextResponse.json(
        { error: 'Failed to check email availability' },
        { status: 500 }
      );
    }

    const exists = !!data?.length;

    return NextResponse.json({
      exists,
      provider: exists ? 'unknown' : null,
    });
  } catch (error) {
    console.error('Error checking email:', error);
    return NextResponse.json(
      { error: 'Failed to check email' },
      { status: 500 }
    );
  }
});