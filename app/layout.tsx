import type { Metadata } from 'next';
import Providers from './providers';

export const metadata: Metadata = { title: 'Aplikacja firmowa — ACDCars' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body style={{ margin: 0 }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
