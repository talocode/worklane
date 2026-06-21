import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'WorkLane — Command Center',
  description: 'Open-source command center for team agents',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#0a0a0f', color: '#e0e0e0' }}>
        {children}
      </body>
    </html>
  );
}
