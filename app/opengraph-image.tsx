// app/opengraph-image.tsx
import { ImageResponse } from 'next/og';
 
export const runtime = 'edge';
export const contentType = 'image/png';
 
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          background: 'white',
          width: '100%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <h1>My Open Graph Image</h1>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}