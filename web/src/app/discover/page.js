'use client';

import { useState, useEffect, useMemo } from 'react';
import { fetchDigest, fetchProducts } from '@/lib/api';

const CATEGORIES = ['all', 'supplements', 'research', 'protocols', 'news'];

function parseDigestToArticles(digestText, products) {
  if (!digestText) return [];

  const articles = [];
  const sections = digestText.split(/## /);

  for (const section of sections) {
    if (!section.trim()) continue;

    const lines = section.split('\n');
    const sectionTitle = lines[0]?.trim();
    const paperBlocks = section.split(/### /);

    for (let i = 1; i < paperBlocks.length; i++) {
      const block = paperBlocks[i];
      const blockLines = block.split('\n');
      const title = blockLines[0]?.trim();
      if (!title) continue;

      let journal = '';
      let doi = '';
      let abstract = '';

      for (const line of blockLines) {
        if (line.startsWith('- **Journal:**')) journal = line.replace('- **Journal:**', '').trim();
        if (line.startsWith('- **DOI:**')) doi = line.replace('- **DOI:**', '').trim();
        if (line.startsWith('- **Abstract:**')) abstract = line.replace('- **Abstract:**', '').trim();
      }

      let category = 'research';
      const lowerTitle = title.toLowerCase();
      const lowerAbstract = abstract.toLowerCase();

      if (sectionTitle?.includes('OTHER')) category = 'news';

      const relatedProduct = products.find(p => {
        const name = p.name.toLowerCase();
        return lowerTitle.includes(name) || lowerAbstract.includes(name) ||
               p.tags?.some(t => lowerTitle.includes(t) || lowerAbstract.includes(t));
      });

      if (relatedProduct) {
        category = relatedProduct.category === 'protocol' ? 'protocols' : 'supplements';
      }

      let evidenceLevel = 'Preprint';
      if (sectionTitle?.includes('ANIMAL')) evidenceLevel = 'Animal Study';
      else if (sectionTitle?.includes('IN-VITRO')) evidenceLevel = 'In Vitro';
      else if (sectionTitle?.includes('OTHER')) evidenceLevel = 'Review';

      articles.push({
        id: i + '-' + title.slice(0, 20).replace(/\s/g, '-'),
        title,
        summary: abstract.slice(0, 300) + (abstract.length > 300 ? '...' : ''),
        fullAbstract: abstract,
        journal,
        doi,
        category,
        evidenceLevel,
        relatedProduct,
      });
    }
  }

  return articles;
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
        <div className="sticky top-0 bg-bg-card border-b border-border px-5 py-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-tertiary uppercase tracking-wider font-medium">{article.evidenceLevel}</span>
            <span className="text-tertiary">·</span>
            <span className="text-xs text-tertiary uppercase tracking-wider font-medium">{article.category}</span>
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

        <div className="px-5 py-4 space-y-5">
          <h2 className="text-lg font-semibold text-primary leading-snug">{article.title}</h2>

          {article.journal && (
            <p className="text-xs text-secondary">{article.journal}</p>
          )}

          {article.doi && (
            <a
              href={`https://doi.org/${article.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-accent hover:underline inline-block"
            >
              DOI: {article.doi}
            </a>
          )}

          {article.fullAbstract && (
            <div className="border-t border-border pt-4">
              <h3 className="text-xs font-medium text-tertiary uppercase tracking-wider mb-2">Abstract</h3>
              <p className="text-sm text-secondary leading-relaxed">{article.fullAbstract}</p>
            </div>
          )}

          {article.relatedProduct && (
            <div className="border-t border-border pt-4">
              <h3 className="text-xs font-medium text-tertiary uppercase tracking-wider mb-2">Related Product</h3>
              <div className="p-3 border border-border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-primary">{article.relatedProduct.name}</span>
                  <span className="text-xs text-secondary">{article.relatedProduct.evidenceGrade}</span>
                </div>
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
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedArticle, setSelectedArticle] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [digest, prods] = await Promise.all([fetchDigest(), fetchProducts()]);
        setProducts(prods);
        setArticles(parseDigestToArticles(digest, prods));
      } catch (err) {
        console.error('Failed to load discover data:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return articles;
    return articles.filter(a => a.category === activeCategory);
  }, [articles, activeCategory]);

  return (
    <div className="animate-fade-in">
      <section className="max-w-3xl mx-auto px-4 md:px-6 pt-10 pb-6">
        <h1 className="text-2xl font-semibold text-primary mb-1">Discover</h1>
        <p className="text-sm text-secondary">
          Latest longevity research from PubMed, bioRxiv, and leading journals.
        </p>

        <div className="flex gap-2 mt-5 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
          {CATEGORIES.map((cat) => (
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
              {cat !== 'all' && articles.length > 0 && (
                <span className="ml-1.5 text-tertiary">
                  {articles.filter(a => cat === 'all' || a.category === cat).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 md:px-6 pb-16">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="py-4 border-b border-border">
                <div className="h-3 bg-bg-hover rounded w-24 mb-3" />
                <div className="h-4 bg-bg-hover rounded w-3/4 mb-2" />
                <div className="h-3 bg-bg-hover rounded w-full" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-secondary text-sm">No articles found in this category.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((article) => (
              <article
                key={article.id}
                onClick={() => setSelectedArticle(article)}
                className="py-4 cursor-pointer group"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs text-tertiary uppercase tracking-wider font-medium">
                    {article.evidenceLevel}
                  </span>
                  <span className="text-tertiary text-xs">·</span>
                  <span className="text-xs text-tertiary uppercase tracking-wider font-medium">
                    {article.category}
                  </span>
                  {article.relatedProduct && (
                    <>
                      <span className="text-tertiary text-xs">·</span>
                      <span className="text-xs text-accent">{article.relatedProduct.name}</span>
                    </>
                  )}
                </div>
                <h3 className="text-sm font-medium text-primary group-hover:text-accent transition-colors duration-150 line-clamp-2 mb-1">
                  {article.title}
                </h3>
                {article.summary && (
                  <p className="text-xs text-secondary line-clamp-2 leading-relaxed">
                    {article.summary}
                  </p>
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
