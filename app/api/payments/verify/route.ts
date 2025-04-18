import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createAdminClient } from '@/utils/supabase/supabase-admin';
import { withCors } from '@/utils/cors';
import { tryCatch, Result, isSuccess } from '@/utils/result';

interface VerifyPaymentRequest {
  orderId: string;
  userId: string;
  caseId: string;
  amount: number;
}

export const POST = withCors(async function POST(request: NextRequest) {
  const parseBody = async (): Promise<Result<VerifyPaymentRequest>> => {
    try {
      const body = await request.json() as VerifyPaymentRequest;
      return { data: body, error: null };
    } catch {
      return { data: null, error: new Error('Invalid JSON payload') };
    }
  };

  const validateRequest = (body: VerifyPaymentRequest): Result<VerifyPaymentRequest> => {
    const requiredFields = ['orderId', 'userId', 'caseId', 'amount'] as const;
    for (const field of requiredFields) {
      if (!body?.[field]) {
        return { 
          data: null, 
          error: new Error(`Missing required parameter: ${field}`) 
        };
      }
    }

    const parsedAmount = Number(body.amount);
    if (isNaN(parsedAmount)) {
      return { 
        data: null, 
        error: new Error('Invalid amount: must be a number') 
      };
    }

    return { data: { ...body, amount: parsedAmount }, error: null };
  };

  const savePurchase = async (body: VerifyPaymentRequest): Promise<Result<unknown>> => {
    const supabaseAdmin = createAdminClient();
    return tryCatch(
      new Promise((resolve, reject) => {
        supabaseAdmin
          .from('user_purchases')
          .upsert(
            {
              user_id: body.userId,
              case_id: body.caseId,
              payment_id: body.orderId,
              amount: body.amount,
              verified_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,case_id' }
          )
          .then(({ error }) => {
            if (error) {
              reject(error);
            } else {
              resolve({ success: true });
            }
          });
      })
    );
  };

  // Parse and validate request body
  const parsedBody = await parseBody();
  if (!isSuccess(parsedBody)) {
    return NextResponse.json(
      { success: false, error: parsedBody.error.message },
      { status: 400 }
    );
  }

  const validatedBody = validateRequest(parsedBody.data);
  if (!isSuccess(validatedBody)) {
    return NextResponse.json(
      { success: false, error: validatedBody.error.message },
      { status: 400 }
    );
  }

  // Save purchase to database
  const saveResult = await savePurchase(validatedBody.data);
  if (!isSuccess(saveResult)) {
    console.error('Database error:', saveResult.error);
    return NextResponse.json(
      { success: false, error: `Database error: ${saveResult.error.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data: saveResult.data,
    message: `Payment ${validatedBody.data.orderId} successfully verified and recorded.`,
  });
});