import { ImageResponse } from 'next/og';
import { Geist } from 'next/font/google';

const geist = Geist({ subsets: ['latin'] });

export const runtime = 'edge';
export const alt = 'Detective Cases - Solve Mysteries Online';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(to bottom, #000000, #1a1a1a)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: geist.style.fontFamily,
          color: 'white',
          padding: '60px',
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            marginBottom: 24,
            textAlign: 'center',
          }}
        >
          Detective Cases
        </div>
        <div
          style={{
            fontSize: 36,
            textAlign: 'center',
            opacity: 0.8,
          }}
        >
          Solve Mysteries Online
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}