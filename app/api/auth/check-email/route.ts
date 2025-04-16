// app/api/auth/check-email/route.ts
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase-admin';
import { withCors } from '@/utils/cors';

export const POST = withCors(async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    // Validate email
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' }, 
        { status: 400 }
      );
    }
    
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' }, 
        { status: 400 }
      );
    }
    
    // Use admin client to bypass RLS
    const supabaseAdmin = createAdminClient();
    
    // Check for the exact email in auth.users (using admin API)
    try {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers({
        filter: { 
          email: email.toLowerCase().trim() // Normalize email 
        }
      });
      
      if (!authError && authData?.users) {
        // Look for exact match (case insensitive but exact)
        const exactMatch = authData.users.find(
          user => user.email?.toLowerCase() === email.toLowerCase()
        );
        
        if (exactMatch) {
          // Found exact match in auth system
          const provider = exactMatch.app_metadata?.provider || 'email';
          
          return NextResponse.json({ 
            exists: true,
            provider
          });
        }
      }
    } catch (authCheckError) {
      console.error('Auth check error:', authCheckError);
      // Continue to fallback check
    }
    
    // Fallback: check public.users table with exact email match
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', email.toLowerCase().trim())
      .limit(1);
    
    if (error) {
      console.error('Email check error:', error);
      return NextResponse.json(
        { error: 'Failed to check email availability' }, 
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      exists: data && data.length > 0,
      provider: data && data.length > 0 ? 'unknown' : null
    });
  } catch (error) {
    console.error('Error checking email:', error);
    return NextResponse.json(
      { error: 'Failed to check email' }, 
      { status: 500 }
    );
  }
});