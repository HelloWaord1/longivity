import './globals.css';

export const metadata = {
  title: 'Longivity — AI-Powered Longevity Platform',
  description: 'Personalized longevity supplements and protocols powered by multi-agent AI research system',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
