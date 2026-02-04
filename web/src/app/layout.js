import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'Longivity — Longevity Research',
  description: 'Evidence-graded longevity supplements, research digest, and personalized stacks.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className="min-h-screen">
        <Navbar />
        <main className="pt-14">
          {children}
        </main>
      </body>
    </html>
  );
}
