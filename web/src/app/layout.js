import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Longivity — AI-Powered Longevity Intelligence',
  description: 'Ask anything about longevity. AI-powered research, evidence-graded supplements, and personalized stacks built from the latest science.',
  keywords: 'longevity, supplements, NMN, NAD+, anti-aging, AI, research, health optimization',
  openGraph: {
    title: 'Longivity — AI-Powered Longevity Intelligence',
    description: 'Evidence-graded longevity supplements and protocols. Ask AI, browse research, build your personalized stack.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🧬</text></svg>" />
      </head>
      <body className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-16">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
