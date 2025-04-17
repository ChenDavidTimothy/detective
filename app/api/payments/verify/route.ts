import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createAdminClient } from '@/utils/supabase-admin';
import { withCors } from '@/utils/cors';

interface VerifyPaymentRequest {
  orderId: string;
  userId: string;
  caseId: string;
  amount: number;
}

export const POST = withCors(async function POST(request: NextRequest) {
  try {
    let body: VerifyPaymentRequest;
    try {
      body = await request.json() as VerifyPaymentRequest;
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    const requiredFields = ['orderId', 'userId', 'caseId', 'amount'] as const;
    for (const field of requiredFields) {
      if (!body?.[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required parameter: ${field}` },
          { status: 400 }
        );
      }
    }

    const { orderId, userId, caseId, amount } = body;
    
    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount)) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount: must be a number' },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
      .from('user_purchases')
      .upsert(
        {
          user_id: userId,
          case_id: caseId,
          payment_id: orderId,
          amount: parsedAmount,
          verified_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,case_id' }
      );

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: `Payment ${orderId} successfully verified and recorded.`,
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Verification error: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      },
      { status: 500 }
    );
  }
});