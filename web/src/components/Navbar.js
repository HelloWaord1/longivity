'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useProtocol } from '@/lib/ProtocolContext';

const links = [
  { href: '/', label: 'Search' },
  { href: '/discover', label: 'Discover' },
  { href: '/products', label: 'Products' },
  { href: '/stack', label: 'Build Stack' },
];

function ProtocolIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="6" rx="1" />
      <rect x="4" y="10" width="16" height="6" rx="1" />
      <rect x="4" y="18" width="16" height="4" rx="1" />
    </svg>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { count, mounted } = useProtocol();

  return (
    <nav className="fixed top-0 w-full z-50 h-14 border-b border-border bg-bg/95 backdrop-blur-sm">
      <div className="max-w-3xl mx-auto px-4 md:px-6 h-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-base font-semibold text-primary hover:text-accent transition-colors duration-150">
          <span className="text-accent text-lg">&#9670;</span>
          Longivity
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {links.map((link) => {
            const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 text-sm transition-colors duration-150 rounded-md ${
                  active
                    ? 'text-primary font-medium'
                    : 'text-secondary hover:text-primary'
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          {/* Protocol icon */}
          <Link
            href="/protocol"
            className={`relative ml-2 p-2 rounded-md transition-colors duration-150 ${
              pathname === '/protocol' ? 'text-primary' : 'text-secondary hover:text-primary'
            }`}
            aria-label="Protocol"
          >
            <ProtocolIcon />
            {mounted && count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent text-bg text-[10px] font-bold rounded-full flex items-center justify-center">
                {count > 9 ? '9+' : count}
              </span>
            )}
          </Link>
        </div>

        {/* Mobile right side: protocol + hamburger */}
        <div className="md:hidden flex items-center gap-1">
          <Link
            href="/protocol"
            className={`relative p-2 transition-colors duration-150 ${
              pathname === '/protocol' ? 'text-primary' : 'text-secondary hover:text-primary'
            }`}
            aria-label="Protocol"
          >
            <ProtocolIcon />
            {mounted && count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent text-bg text-[10px] font-bold rounded-full flex items-center justify-center">
                {count > 9 ? '9+' : count}
              </span>
            )}
          </Link>

          <button
            className="p-2 -mr-2 text-secondary hover:text-primary transition-colors"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 8h16M4 16h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden border-b border-border bg-bg animate-fade-in">
          <div className="max-w-3xl mx-auto px-4 py-2">
            {links.map((link) => {
              const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`block px-3 py-2.5 text-sm rounded-md transition-colors duration-150 ${
                    active
                      ? 'text-primary font-medium bg-bg-hover'
                      : 'text-secondary hover:text-primary'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <Link
              href="/protocol"
              onClick={() => setOpen(false)}
              className={`block px-3 py-2.5 text-sm rounded-md transition-colors duration-150 ${
                pathname === '/protocol'
                  ? 'text-primary font-medium bg-bg-hover'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              Protocol{mounted && count > 0 ? ` (${count})` : ''}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
