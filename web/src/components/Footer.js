import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-border/50 bg-bg-card/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🧬</span>
              <span className="text-lg font-bold">Longivity</span>
            </div>
            <p className="text-muted text-sm max-w-md leading-relaxed">
              AI-powered longevity platform. Multi-agent research system that monitors the latest 
              science and builds personalized supplement stacks.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Platform</h4>
            <div className="space-y-2">
              <Link href="/" className="block text-sm text-muted hover:text-accent transition-colors">Search</Link>
              <Link href="/discover" className="block text-sm text-muted hover:text-accent transition-colors">Discover</Link>
              <Link href="/products" className="block text-sm text-muted hover:text-accent transition-colors">Products</Link>
              <Link href="/stack" className="block text-sm text-muted hover:text-accent transition-colors">Stack Builder</Link>
            </div>
          </div>

          {/* Info */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Information</h4>
            <div className="space-y-2">
              <p className="text-sm text-muted">Not medical advice</p>
              <p className="text-sm text-muted">Consult a healthcare professional</p>
              <p className="text-sm text-muted">© 2026 Longivity</p>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted">Built with multi-agent AI · Powered by science</p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted">🔬 44+ research papers indexed</span>
            <span className="text-xs text-muted">💊 48+ products graded</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
