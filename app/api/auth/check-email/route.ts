import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createAdminClient } from '@/utils/supabase/supabase-admin';
import { withCors } from '@/utils/cors';
import { tryCatch, Result, isSuccess, isFailure } from '@/utils/result';

interface CheckEmailRequest {
  email: string;
}

interface CheckEmailResponse {
  exists: boolean;
  provider: string | null;
}

const validateEmail = (email: string): Result<string> => {
  if (!email) {
    return { data: null, error: new Error('Email is required') };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { data: null, error: new Error('Invalid email format') };
  }

  return { data: email.toLowerCase(), error: null };
};

const checkAuthUsers = async (email: string): Promise<Result<CheckEmailResponse>> => {
  const supabaseAdmin = createAdminClient();
  return tryCatch(
    new Promise<CheckEmailResponse>((resolve, reject) => {
      supabaseAdmin.auth.admin.listUsers()
        .then(({ data: authData, error: authError }) => {
          if (authError) {
            reject(authError);
            return;
          }

          if (authData?.users) {
            const exactMatch = authData.users.find(
              user => user.email?.toLowerCase() === email
            );

            if (exactMatch) {
              resolve({
                exists: true,
                provider: exactMatch.app_metadata?.provider || 'email',
              });
              return;
            }
          }

          resolve({ exists: false, provider: null });
        });
    })
  );
};

const checkPublicUsers = async (email: string): Promise<Result<CheckEmailResponse>> => {
  const supabaseAdmin = createAdminClient();
  return tryCatch(
    new Promise<CheckEmailResponse>((resolve, reject) => {
      supabaseAdmin
        .from('users')
        .select('id, email')
        .eq('email', email)
        .limit(1)
        .then(({ data, error }) => {
          if (error) {
            reject(error);
            return;
          }

          resolve({
            exists: !!data?.length,
            provider: data?.length ? 'unknown' : null,
          });
        });
    })
  );
};

export const POST = withCors(async function POST(request: NextRequest) {
  // Parse request body using tryCatch
  const parseBodyResult = await tryCatch<CheckEmailRequest>(request.json());
  
  if (isFailure(parseBodyResult)) {
    return NextResponse.json(
      { error: 'Invalid JSON payload' },
      { status: 400 }
    );
  }
  
  const body = parseBodyResult.data;
  
  // Validate request data
  const validatedEmailResult = validateEmail(body.email);
  if (isFailure(validatedEmailResult)) {
    return NextResponse.json(
      { error: validatedEmailResult.error.message },
      { status: 400 }
    );
  }
  
  // Check auth users with tryCatch
  const authResult = await checkAuthUsers(validatedEmailResult.data);
  if (isSuccess(authResult)) {
    return NextResponse.json(authResult.data);
  }
  
  // Fallback to public users check
  const publicResult = await checkPublicUsers(validatedEmailResult.data);
  if (isSuccess(publicResult)) {
    return NextResponse.json(publicResult.data);
  }
  
  console.error('Email check error:', publicResult.error);
  return NextResponse.json(
    { error: 'Failed to check email availability' },
    { status: 500 }
  );
});