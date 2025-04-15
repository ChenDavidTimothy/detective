import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase-admin';
import { withCors } from '@/utils/cors';

export const POST = withCors(async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Use admin API to search for existing users
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      throw error;
    }
    
    // Find user by email
    const existingUser = data.users.find(user => 
      user.email?.toLowerCase() === email.toLowerCase()
    );
    
    if (!existingUser) {
      return NextResponse.json({ exists: false });
    }
    
    // Get the authentication provider
    const provider = existingUser.app_metadata?.provider || 'email';
    
    return NextResponse.json({ 
      exists: true, 
      provider,
      email_confirmed: !!existingUser.email_confirmed_at 
    });
  } catch (error) {
    console.error('Error checking email:', error);
    return NextResponse.json(
      { error: 'Failed to check email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
});