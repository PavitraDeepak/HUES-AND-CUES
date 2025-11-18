import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hues & Cues - Multiplayer Color Game',
  description: 'Play the multiplayer color guessing game with friends!',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
