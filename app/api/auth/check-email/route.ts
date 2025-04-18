import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createAdminClient } from '@/utils/supabase/supabase-admin';
import { withCors } from '@/utils/cors';
import { tryCatch, Result, isSuccess } from '@/utils/result';

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
  // Parse request body
  const parseBody = async (): Promise<Result<CheckEmailRequest>> => {
    try {
      const body = await request.json() as CheckEmailRequest;
      return { data: body, error: null };
    } catch {
      return { data: null, error: new Error('Invalid JSON payload') };
    }
  };

  // Parse and validate request body
  const parsedBody = await parseBody();
  if (!isSuccess(parsedBody)) {
    return NextResponse.json(
      { error: parsedBody.error.message },
      { status: 400 }
    );
  }

  const validatedEmail = validateEmail(parsedBody.data.email);
  if (!isSuccess(validatedEmail)) {
    return NextResponse.json(
      { error: validatedEmail.error.message },
      { status: 400 }
    );
  }

  // Check auth.users first
  const authResult = await checkAuthUsers(validatedEmail.data);
  if (isSuccess(authResult)) {
    return NextResponse.json(authResult.data);
  }

  // Fallback to public.users check
  const publicResult = await checkPublicUsers(validatedEmail.data);
  if (isSuccess(publicResult)) {
    return NextResponse.json(publicResult.data);
  }

  console.error('Email check error:', publicResult.error);
  return NextResponse.json(
    { error: 'Failed to check email availability' },
    { status: 500 }
  );
});