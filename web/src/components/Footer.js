import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-10">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
          <div>
            <span className="text-sm font-semibold text-primary">Longivity</span>
            <p className="text-xs text-tertiary mt-1 max-w-xs leading-relaxed">
              Evidence-graded longevity research and personalized supplement stacks.
            </p>
          </div>

          <div className="flex gap-6">
            <Link href="/" className="text-xs text-secondary hover:text-primary transition-colors duration-150">Search</Link>
            <Link href="/discover" className="text-xs text-secondary hover:text-primary transition-colors duration-150">Discover</Link>
            <Link href="/products" className="text-xs text-secondary hover:text-primary transition-colors duration-150">Products</Link>
            <Link href="/stack" className="text-xs text-secondary hover:text-primary transition-colors duration-150">Stack</Link>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-border flex items-center justify-between">
          <p className="text-xs text-tertiary">&copy; 2026 Longivity</p>
          <p className="text-xs text-tertiary">Not medical advice</p>
        </div>
      </div>
    </footer>
  );
}
