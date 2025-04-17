import { ImageResponse } from 'next/og';
 
export const runtime = 'edge';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';
 
export default function Image() {
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
        <h1>Detective Cases</h1>
        <p>Share your detective journey on Twitter</p>
      </div>
    )
  );
}