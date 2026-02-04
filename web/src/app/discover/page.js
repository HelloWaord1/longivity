'use client';

import { useState, useEffect, useMemo } from 'react';
import { fetchArticles } from '@/lib/api';

const CATEGORIES = ['all', 'supplements', 'research', 'protocols', 'news'];
const TYPE_FILTERS = ['all', 'generated', 'web'];

const EVIDENCE_COLORS = {
  'Meta-Analysis': 'text-grade-a',
  'RCT': 'text-grade-a',
  'Cohort': 'text-grade-b',
  'Review': 'text-grade-b',
  'Animal': 'text-grade-c',
  'In Vitro': 'text-grade-c',
  'Preprint': 'text-secondary',
};

/**
 * Minimal markdown renderer for article bodies
 * Handles: ## headings, **bold**, *italic*, - bullets, [links](url), \n\n paragraphs
 */
function renderMarkdown(text) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Heading
    if (line.startsWith('## ')) {
      elements.push(
        <h3 key={key++} className="text-sm font-semibold text-primary mt-5 mb-2 uppercase tracking-wider">
          {line.replace('## ', '')}
        </h3>
      );
      continue;
    }

    // Bullet point
    if (line.startsWith('- ')) {
      const content = line.slice(2);
      elements.push(
        <li key={key++} className="text-sm text-secondary leading-relaxed ml-4 mb-1.5 list-disc">
          {renderInline(content)}
        </li>
      );
      continue;
    }

    // Indented sub-text (e.g., "  *Mechanisms:*")
    if (line.startsWith('  ')) {
      elements.push(
        <p key={key++} className="text-xs text-tertiary ml-6 mb-1">
          {renderInline(line.trim())}
        </p>
      );
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={key++} className="text-sm text-secondary leading-relaxed mb-2">
        {renderInline(line)}
      </p>
    );
  }

  return <div>{elements}</div>;
}

function renderInline(text) {
  // Process inline markdown: **bold**, *italic*, [text](url)
  const parts = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    // Italic
    const italicMatch = remaining.match(/\*(.+?)\*/);
    // Link
    const linkMatch = remaining.match(/\[(.+?)\]\((.+?)\)/);

    // Find earliest match
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
    if (italicMatch && !boldMatch && remaining.indexOf(italicMatch[0]) < earliestIdx) {
      earliest = { type: 'italic', match: italicMatch, idx: remaining.indexOf(italicMatch[0]) };
      earliestIdx = earliest.idx;
    }

    if (!earliest) {
      parts.push(remaining);
      break;
    }

    // Text before match
    if (earliest.idx > 0) {
      parts.push(remaining.slice(0, earliest.idx));
    }

    if (earliest.type === 'bold') {
      parts.push(<strong key={key++} className="text-primary font-medium">{earliest.match[1]}</strong>);
      remaining = remaining.slice(earliest.idx + earliest.match[0].length);
    } else if (earliest.type === 'italic') {
      parts.push(<em key={key++} className="text-secondary italic">{earliest.match[1]}</em>);
      remaining = remaining.slice(earliest.idx + earliest.match[0].length);
    } else if (earliest.type === 'link') {
      parts.push(
        <a key={key++} href={earliest.match[2]} target="_blank" rel="noopener noreferrer"
           className="text-accent hover:underline">
          {earliest.match[1]}
        </a>
      );
      remaining = remaining.slice(earliest.idx + earliest.match[0].length);
    }
  }

  return parts;
}

function ArticleDetail({ article, onClose }) {
  useEffect(() => {
    const handleEsc = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-bg-card border border-border rounded-t-xl md:rounded-xl animate-fade-in">
        {/* Header */}
        <div className="sticky top-0 bg-bg-card border-b border-border px-5 py-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {article.type === 'web' ? (
              <span className="text-xs uppercase tracking-wider font-medium text-blue-400">
                ↗ External
              </span>
            ) : (
              <span className={`text-xs uppercase tracking-wider font-medium ${EVIDENCE_COLORS[article.evidenceLevel] || 'text-secondary'}`}>
                {article.evidenceLevel}
              </span>
            )}
            <span className="text-tertiary">·</span>
            <span className="text-xs text-tertiary uppercase tracking-wider font-medium">
              {article.category}
            </span>
            {article.source && article.type === 'web' && (
              <>
                <span className="text-tertiary">·</span>
                <span className="text-xs text-secondary font-medium">
                  {article.source}
                </span>
              </>
            )}
            {article.featured && (
              <>
                <span className="text-tertiary">·</span>
                <span className="text-xs text-accent font-medium">⭐ Featured</span>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-tertiary hover:text-primary transition-colors shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-4 space-y-4">
          <h2 className="text-lg font-semibold text-primary leading-snug">{article.title}</h2>

          <p className="text-sm text-secondary leading-relaxed">{article.summary}</p>

          {/* Web article: Read Original button + metadata */}
          {article.type === 'web' && article.url && (
            <div className="flex items-center gap-3">
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
              >
                ↗ Read Original Article
              </a>
              {article.author && (
                <span className="text-xs text-tertiary">by {article.author}</span>
              )}
              {article.relevanceScore != null && (
                <span className="text-xs text-tertiary ml-auto">
                  Relevance: {Math.round(article.relevanceScore * 100)}%
                </span>
              )}
            </div>
          )}

          {/* Tags — use tags for generated, matchedKeywords for web */}
          {(article.tags || article.matchedKeywords || []).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {(article.tags || article.matchedKeywords || []).slice(0, 6).map(tag => (
                <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-bg-hover text-tertiary">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Article body (generated articles only) */}
          {article.body && (
            <div className="border-t border-border pt-4">
              {renderMarkdown(article.body)}
            </div>
          )}

          {/* Source papers */}
          {article.sourcePapers && article.sourcePapers.length > 0 && (
            <div className="border-t border-border pt-4">
              <h3 className="text-xs font-medium text-tertiary uppercase tracking-wider mb-2">
                Sources ({article.sourcePapers.length})
              </h3>
              <div className="space-y-2">
                {article.sourcePapers.map((paper, i) => (
                  <div key={i} className="text-xs text-secondary">
                    <span>{paper.title}</span>
                    {paper.journal && (
                      <span className="text-tertiary italic"> — {paper.journal}</span>
                    )}
                    {paper.doi && (
                      <a
                        href={`https://doi.org/${paper.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline ml-1"
                      >
                        DOI
                      </a>
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
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeType, setActiveType] = useState('all');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [availableCategories, setAvailableCategories] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchArticles();
        setArticles(data.articles || []);
        setAvailableCategories(data.categories || []);
      } catch (err) {
        console.error('Failed to load articles:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    return articles.filter(a => {
      if (activeCategory !== 'all' && a.category !== activeCategory) return false;
      if (activeType !== 'all' && (a.type || 'generated') !== activeType) return false;
      return true;
    });
  }, [articles, activeCategory, activeType]);

  const featuredArticles = useMemo(() => filtered.filter(a => a.featured), [filtered]);
  const regularArticles = useMemo(() => filtered.filter(a => !a.featured), [filtered]);

  return (
    <div className="animate-fade-in">
      <section className="max-w-3xl mx-auto px-4 md:px-6 pt-10 pb-6">
        <h1 className="text-2xl font-semibold text-primary mb-1">Discover</h1>
        <p className="text-sm text-secondary">
          AI-curated longevity articles from the latest research and evidence-graded supplements.
        </p>

        {/* Type + Category filters */}
        <div className="flex flex-col gap-2 mt-5">
          {/* Type filter */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
            {TYPE_FILTERS.map((type) => {
              const count = type === 'all'
                ? articles.length
                : articles.filter(a => (a.type || 'generated') === type).length;

              if (type !== 'all' && count === 0) return null;

              const labels = { all: '📰 All', generated: '🧬 AI-Generated', web: '🌐 Web Sources' };

              return (
                <button
                  key={type}
                  onClick={() => setActiveType(type)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors duration-150 ${
                    activeType === type
                      ? 'bg-bg-card text-primary border border-border'
                      : 'text-tertiary hover:text-secondary'
                  }`}
                >
                  {labels[type] || type}
                  <span className="ml-1.5 text-tertiary">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Category filter */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
            {CATEGORIES.map((cat) => {
              const count = cat === 'all'
                ? articles.length
                : articles.filter(a => a.category === cat).length;

              // Hide categories with 0 articles (except 'all')
              if (cat !== 'all' && count === 0) return null;

              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors duration-150 ${
                    activeCategory === cat
                      ? 'bg-bg-card text-primary border border-border'
                      : 'text-tertiary hover:text-secondary'
                  }`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  <span className="ml-1.5 text-tertiary">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 md:px-6 pb-16">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="py-4 border-b border-border">
                <div className="h-3 bg-bg-hover rounded w-24 mb-3 animate-pulse" />
                <div className="h-4 bg-bg-hover rounded w-3/4 mb-2 animate-pulse" />
                <div className="h-3 bg-bg-hover rounded w-full animate-pulse" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-secondary text-sm">No articles found in this category.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {/* Featured articles with subtle highlight */}
            {featuredArticles.map((article) => (
              <article
                key={article.id}
                onClick={() => setSelectedArticle(article)}
                className="py-4 cursor-pointer group border-l-2 border-l-accent pl-4 -ml-4"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs text-accent font-medium">⭐ Featured</span>
                  <span className="text-tertiary text-xs">·</span>
                  <span className={`text-xs uppercase tracking-wider font-medium ${EVIDENCE_COLORS[article.evidenceLevel] || 'text-secondary'}`}>
                    {article.evidenceLevel}
                  </span>
                  <span className="text-tertiary text-xs">·</span>
                  <span className="text-xs text-tertiary uppercase tracking-wider font-medium">
                    {article.category}
                  </span>
                </div>
                <h3 className="text-sm font-medium text-primary group-hover:text-accent transition-colors duration-150 line-clamp-2 mb-1">
                  {article.title}
                </h3>
                <p className="text-xs text-secondary line-clamp-2 leading-relaxed">
                  {article.summary}
                </p>
                {article.tags && (
                  <div className="flex gap-1.5 mt-2">
                    {article.tags.slice(0, 4).map(tag => (
                      <span key={tag} className="text-xs px-1.5 py-0.5 rounded-full bg-bg-hover text-tertiary">
                        {tag}
                      </span>
                    ))}
                    {article.sourcePapers && (
                      <span className="text-xs text-tertiary ml-auto">
                        {article.sourcePapers.length} source{article.sourcePapers.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                )}
              </article>
            ))}

            {/* Regular articles */}
            {regularArticles.map((article) => (
              <article
                key={article.id}
                onClick={() => setSelectedArticle(article)}
                className="py-4 cursor-pointer group"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  {article.type === 'web' ? (
                    <span className="text-xs uppercase tracking-wider font-medium text-blue-400">
                      ↗ {article.source || 'External'}
                    </span>
                  ) : (
                    <span className={`text-xs uppercase tracking-wider font-medium ${EVIDENCE_COLORS[article.evidenceLevel] || 'text-secondary'}`}>
                      {article.evidenceLevel}
                    </span>
                  )}
                  <span className="text-tertiary text-xs">·</span>
                  <span className="text-xs text-tertiary uppercase tracking-wider font-medium">
                    {article.category}
                  </span>
                  {article.publishedAt && (
                    <>
                      <span className="text-tertiary text-xs">·</span>
                      <span className="text-xs text-tertiary">
                        {new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </>
                  )}
                </div>
                <h3 className="text-sm font-medium text-primary group-hover:text-accent transition-colors duration-150 line-clamp-2 mb-1">
                  {article.title}
                </h3>
                <p className="text-xs text-secondary line-clamp-2 leading-relaxed">
                  {article.summary}
                </p>
                {(article.tags || article.matchedKeywords) && (
                  <div className="flex gap-1.5 mt-2">
                    {(article.tags || article.matchedKeywords || []).slice(0, 4).map(tag => (
                      <span key={tag} className="text-xs px-1.5 py-0.5 rounded-full bg-bg-hover text-tertiary">
                        {tag}
                      </span>
                    ))}
                    {article.sourcePapers && (
                      <span className="text-xs text-tertiary ml-auto">
                        {article.sourcePapers.length} source{article.sourcePapers.length !== 1 ? 's' : ''}
                      </span>
                    )}
                    {article.type === 'web' && article.relevanceScore != null && (
                      <span className="text-xs text-tertiary ml-auto">
                        {Math.round(article.relevanceScore * 100)}% match
                      </span>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {selectedArticle && (
        <ArticleDetail article={selectedArticle} onClose={() => setSelectedArticle(null)} />
      )}
    </div>
  );
}
