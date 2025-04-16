import { NextResponse } from 'next/server';
import type { NextRequest, NextFetchEvent } from 'next/server';

function getCorsHeaders(request: NextRequest) {
  const allowedOrigins: ReadonlyArray<string> = [
    'http://localhost:3000',
    'https://NextTemp.vercel.app',
  ];
  const origin = request.headers.get('origin') || '';

  return {
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin)
      ? origin
      : allowedOrigins[0],
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, stripe-signature, x-client-info',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
}

type NextHandler = (
  request: NextRequest,
  event?: NextFetchEvent
) => Promise<NextResponse>;

export function withCors(handler: NextHandler): NextHandler {
  return async function corsHandler(request, event) {
    if (request.method === 'OPTIONS') {
      return NextResponse.json({}, { headers: getCorsHeaders(request) });
    }

    const response = await handler(request, event);

    Object.entries(getCorsHeaders(request)).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  };
}
