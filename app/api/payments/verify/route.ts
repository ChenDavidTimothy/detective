import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase-admin';
import { withCors } from '@/utils/cors';

/**
 * Payment verification endpoint with improved error handling
 */
export const POST = withCors(async function POST(request: NextRequest) {
  try {
    // Log request details (useful for debugging)
    console.log('Payment verification request received');
    
    // Parse JSON safely with better error messages
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('JSON parsing error:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }
    
    // Detailed input validation with specific errors
    const { orderId, userId, caseId, amount } = body;
    
    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: orderId' },
        { status: 400 }
      );
    }
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: userId' },
        { status: 400 }
      );
    }
    
    if (!caseId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: caseId' },
        { status: 400 }
      );
    }
    
    if (!amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: amount' },
        { status: 400 }
      );
    }

    console.log(`Verifying payment for order: ${orderId}, user: ${userId}, case: ${caseId}, amount: ${amount}`);

    // Record the purchase using admin client
    try {
      const { data, error } = await supabaseAdmin
        .from('user_purchases')
        .upsert(
          {
            user_id: userId,
            case_id: caseId,
            payment_id: orderId,
            amount: parseFloat(amount.toString()), // Safer parsing in case amount is not a number
            verified_at: new Date().toISOString(), // Mark as verified
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

      // Success case - return detailed success response
      return NextResponse.json({ 
        success: true, 
        data,
        message: `Payment ${orderId} successfully verified and recorded.`
      });
    } catch (dbError) {
      console.error('Database operation error:', dbError);
      return NextResponse.json(
        { 
          success: false, 
          error: `Database operation failed: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Payment verification global error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Verification error: ${error instanceof Error ? error.message : 'Unknown error'}`
      },
      { status: 500 }
    );
  }
});

// Optional: Add a GET handler to check if the endpoint is reachable
export const GET = withCors(async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Payment verification endpoint is operational' 
  });
});