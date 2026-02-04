'use client';

import { useState, useEffect, useMemo } from 'react';
import { fetchArticles } from '@/lib/api';

/**
 * Minimal markdown renderer for article bodies
 */
function renderMarkdown(text) {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('## ')) {
      elements.push(<h3 key={key++} className="text-sm font-semibold text-primary mt-5 mb-2">{line.replace('## ', '')}</h3>);
    } else if (line.startsWith('- ')) {
      elements.push(<li key={key++} className="text-sm text-secondary leading-relaxed ml-4 mb-1.5 list-disc">{renderInline(line.slice(2))}</li>);
    } else if (line.startsWith('  ')) {
      elements.push(<p key={key++} className="text-xs text-tertiary ml-6 mb-1">{renderInline(line.trim())}</p>);
    } else if (line.trim() === '') {
      continue;
    } else {
      elements.push(<p key={key++} className="text-sm text-secondary leading-relaxed mb-2">{renderInline(line)}</p>);
    }
  }
  return <div>{elements}</div>;
}

function renderInline(text) {
  const parts = [];
  let remaining = text;
  let key = 0;
  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    const linkMatch = remaining.match(/\[(.+?)\]\((.+?)\)/);
    let earliest = null;
    let earliestIdx = remaining.length;
    if (boldMatch && remaining.indexOf(boldMatch[0]) < earliestIdx) {
      earliest = { type: 'bold', match: boldMatch, idx: remaining.indexOf(boldMatch[0]) };
      earliestIdx = earliest.idx;
    }
    if (linkMatch && remaining.indexOf(linkMatch[0]) < earliestIdx) {
      earliest = { type: 'link', match: linkMatch, idx: remaining.indexOf(linkMatch[0]) };
      earliestIdx = earliest.idx;
    }
    if (!earliest) { parts.push(remaining); break; }
    if (earliest.idx > 0) parts.push(remaining.slice(0, earliest.idx));
    if (earliest.type === 'bold') {
      parts.push(<strong key={key++} className="text-primary font-medium">{earliest.match[1]}</strong>);
    } else if (earliest.type === 'link') {
      parts.push(<a key={key++} href={earliest.match[2]} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">{earliest.match[1]}</a>);
    }
    remaining = remaining.slice(earliest.idx + earliest.match[0].length);
  }
  return parts;
}

function ArticleDetail({ article, onClose }) {
  useEffect(() => {
    const handleEsc = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', handleEsc); document.body.style.overflow = ''; };
  }, [onClose]);

  const isWeb = article.type === 'web';

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-bg-card border border-border rounded-t-xl md:rounded-xl animate-fade-in">
        <div className="sticky top-0 bg-bg-card border-b border-border px-5 py-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-tertiary">
            {isWeb && article.source && <span className="text-secondary">{article.source}</span>}
            {!isWeb && article.evidenceLevel && <span>{article.evidenceLevel}</span>}
            <span>·</span>
            <span>{article.category}</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-tertiary hover:text-primary transition-colors shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <h2 className="text-lg font-semibold text-primary leading-snug">{article.title}</h2>
          <p className="text-sm text-secondary leading-relaxed">{article.summary}</p>

          {isWeb && article.url && (
            <a href={article.url} target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-1 text-xs text-accent hover:underline">
              Read original article →
            </a>
          )}

          {article.body && (
            <div className="border-t border-border pt-4">
              {renderMarkdown(article.body)}
            </div>
          )}

          {article.sourcePapers && article.sourcePapers.length > 0 && (
            <div className="border-t border-border pt-4">
              <h3 className="text-xs font-medium text-tertiary mb-2">Sources</h3>
              <div className="space-y-2">
                {article.sourcePapers.map((paper, i) => (
                  <div key={i} className="text-xs text-secondary">
                    {paper.title}
                    {paper.journal && <span className="text-tertiary"> — {paper.journal}</span>}
                    {paper.doi && (
                      <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline ml-1">DOI</a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DiscoverPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedArticle, setSelectedArticle] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchArticles();
        setArticles(data.articles || []);
      } catch (err) {
        console.error('Failed to load articles:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Single combined filter: all / research / supplements / protocols / web
  const FILTERS = useMemo(() => {
    const counts = { all: articles.length };
    for (const a of articles) {
      if (a.type === 'web') counts.web = (counts.web || 0) + 1;
      if (a.category) counts[a.category] = (counts[a.category] || 0) + 1;
    }
    return ['all', 'research', 'supplements', 'protocols', 'web']
      .filter(f => counts[f] > 0)
      .map(f => ({ key: f, label: f.charAt(0).toUpperCase() + f.slice(1), count: counts[f] }));
  }, [articles]);

  const filtered = useMemo(() => {
    if (filter === 'all') return articles;
    if (filter === 'web') return articles.filter(a => a.type === 'web');
    return articles.filter(a => a.category === filter);
  }, [articles, filter]);

  return (
    <div className="animate-fade-in">
      <section className="max-w-3xl mx-auto px-4 md:px-6 pt-10 pb-4">
        <h1 className="text-xl font-semibold text-primary mb-1">Discover</h1>
        <p className="text-sm text-secondary mb-5">
          Longevity research and news from across the web.
        </p>

        {/* Single row of filters — no emoji, no double rows */}
        <div className="flex gap-1 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
          {FILTERS.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors duration-150 ${
                filter === key
                  ? 'bg-bg-card text-primary border border-border'
                  : 'text-tertiary hover:text-secondary'
              }`}
            >
              {label} <span className="text-tertiary ml-0.5">{count}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 md:px-6 pb-16">
        {loading ? (
          <div className="space-y-0 divide-y divide-border">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="py-4">
                <div className="h-3 bg-bg-hover rounded w-20 mb-2" />
                <div className="h-4 bg-bg-hover rounded w-3/4 mb-1.5" />
                <div className="h-3 bg-bg-hover rounded w-full" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-secondary text-sm">No articles found.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((article) => {
              const isWeb = article.type === 'web';
              return (
                <article
                  key={article.id}
                  onClick={() => setSelectedArticle(article)}
                  className="py-4 cursor-pointer group"
                >
                  {/* Metadata line — minimal, no emoji, no caps shouting */}
                  <div className="flex items-center gap-1.5 mb-1 text-xs text-tertiary">
                    {isWeb && article.source ? (
                      <span>{article.source}</span>
                    ) : article.evidenceLevel ? (
                      <span>{article.evidenceLevel}</span>
                    ) : null}
                    {article.category && (
                      <>
                        <span>·</span>
                        <span>{article.category}</span>
                      </>
                    )}
                    {article.publishedAt && (
                      <>
                        <span>·</span>
                        <span>{new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </>
                    )}
                    {isWeb && <span className="text-tertiary ml-auto">↗</span>}
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-medium text-primary group-hover:text-accent transition-colors duration-150 leading-snug mb-0.5">
                    {article.title}
                  </h3>

                  {/* Summary — 2 lines max */}
                  {article.summary && (
                    <p className="text-xs text-secondary line-clamp-2 leading-relaxed">
                      {article.summary}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {selectedArticle && (
        <ArticleDetail article={selectedArticle} onClose={() => setSelectedArticle(null)} />
      )}
    </div>
  );
}
