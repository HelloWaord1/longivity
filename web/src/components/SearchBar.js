'use client';

import { useState, useRef, useEffect } from 'react';

export default function SearchBar({ onSearch, placeholder = 'Search longevity research...', autoFocus = false }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-xl mx-auto">
      <svg
        className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" strokeLinecap="round" />
      </svg>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-11 pr-20 py-3 bg-bg-card border border-border rounded-lg text-sm text-primary placeholder:text-tertiary focus:outline-none focus:border-secondary transition-colors duration-150"
      />
      <button
        type="submit"
        disabled={!query.trim()}
        className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-accent text-bg text-xs font-medium rounded-md hover:bg-accent-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150"
      >
        Search
      </button>
    </form>
  );
}
