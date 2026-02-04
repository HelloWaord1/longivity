'use client';

import { useState, useRef, useEffect } from 'react';

export default function SearchBar({ onSearch, placeholder = 'Ask anything about longevity...', large = false, autoFocus = false }) {
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
    <form onSubmit={handleSubmit} className="relative w-full max-w-2xl mx-auto group">
      <div className="relative">
        {/* Search icon */}
        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-accent transition-colors">
          <svg className={`${large ? 'w-6 h-6' : 'w-5 h-5'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className={`search-input ${large ? 'pl-14 pr-28 py-5 text-lg' : 'pl-12 pr-24 py-4 text-base'}`}
        />

        {/* Submit button */}
        <button
          type="submit"
          disabled={!query.trim()}
          className={`absolute right-3 top-1/2 -translate-y-1/2 btn-primary disabled:opacity-30 disabled:cursor-not-allowed ${
            large ? 'px-5 py-2.5 text-sm' : 'px-4 py-2 text-sm'
          }`}
        >
          Search
        </button>
      </div>

      {/* Glow effect */}
      <div className="absolute inset-0 -z-10 rounded-2xl bg-accent/5 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
    </form>
  );
}
