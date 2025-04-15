import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const POST = async (request: Request) => {
  try {
    const { email } = await request.json();
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data, error } = await adminClient.auth.admin.listUsers();
    if (error) throw error;

    const user = data.users.find(
      user => user.email?.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
      return NextResponse.json({ exists: false });
    }

    // Supabase stores providers in app_metadata
    const provider = user.app_metadata?.provider || 'email';

    return NextResponse.json({ exists: true, provider });
  } catch (error) {
    return NextResponse.json({ exists: false });
  }
};
