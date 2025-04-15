// app/opengraph-image.tsx
import { ImageResponse } from 'next/og';
 
export const runtime = 'edge';
 
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: 'white',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <div style={{ 
          fontSize: 64,
          fontWeight: 'bold',
          background: 'linear-gradient(to right, #2563eb, #4338ca)',
          backgroundClip: 'text',
          color: 'transparent',
          marginBottom: 16
        }}>
          Detective Cases
        </div>
        <div style={{ fontSize: 32, color: '#333', marginTop: 16 }}>
          Solve Mysteries Online
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}