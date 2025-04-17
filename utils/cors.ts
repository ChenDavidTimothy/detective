import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function getCorsHeaders(request: NextRequest) {
  const allowedOrigins: ReadonlyArray<string> = [
    'http://localhost:3000',
    'https://detective-5f6rvf69v-davids-projects-6c7fecce.vercel.app/',
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

// Simpler approach using Next.js route handler function type
export function withCors(handler: (request: NextRequest) => Promise<Response>) {
  return async function corsHandler(request: NextRequest): Promise<Response> {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: getCorsHeaders(request),
      });
    }

    // Call the original handler
    const response = await handler(request);
    
    // Clone the response so we can modify headers
    const newResponse = NextResponse.json(
      await response.json(),
      {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      }
    );

    // Add CORS headers
    Object.entries(getCorsHeaders(request)).forEach(([key, value]) => {
      newResponse.headers.set(key, value);
    });

    return newResponse;
  };
}