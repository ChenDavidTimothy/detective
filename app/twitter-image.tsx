// app/twitter-image.tsx
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
        }}
      >
        <div style={{ 
          fontSize: 48,
          fontWeight: 'bold',
          background: 'linear-gradient(to right, #2563eb, #4338ca)',
          backgroundClip: 'text',
          color: 'transparent'
        }}>
          Detective Cases
        </div>
        <div style={{ fontSize: 24, color: '#333', marginTop: 16 }}>
          Solve Mysteries Online
        </div>
      </div>
    ),
    {
      width: 800,
      height: 418,
    },
  );
}