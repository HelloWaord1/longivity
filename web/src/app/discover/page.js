'use client';

import { useState, useEffect, useMemo } from 'react';
import { fetchDigest, fetchProducts, getCategoryEmoji, getCategoryGradient, getGradeColor } from '@/lib/api';

const CATEGORIES = ['all', 'supplements', 'research', 'protocols', 'news'];

function parseDigestToArticles(digestText, products) {
  if (!digestText) return [];

  const articles = [];
  const sections = digestText.split(/## /);
  
  for (const section of sections) {
    if (!section.trim()) continue;
    
    const lines = section.split('\n');
    const sectionTitle = lines[0]?.trim();
    
    // Parse individual papers within the section
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

      // Determine category based on section or content
      let category = 'research';
      const lowerTitle = title.toLowerCase();
      const lowerAbstract = abstract.toLowerCase();
      
      if (sectionTitle?.includes('PREPRINT')) category = 'research';
      else if (sectionTitle?.includes('ANIMAL') || sectionTitle?.includes('IN-VITRO')) category = 'research';
      else if (sectionTitle?.includes('OTHER')) category = 'news';

      // Check if related to any product
      const relatedProduct = products.find(p => {
        const name = p.name.toLowerCase();
        return lowerTitle.includes(name) || lowerAbstract.includes(name) ||
               p.tags?.some(t => lowerTitle.includes(t) || lowerAbstract.includes(t));
      });

      if (relatedProduct) {
        category = relatedProduct.category === 'protocol' ? 'protocols' : 'supplements';
      }

      // Determine evidence level
      let evidenceLevel = 'Preprint';
      if (sectionTitle?.includes('ANIMAL')) evidenceLevel = 'Animal Study';
      else if (sectionTitle?.includes('IN-VITRO')) evidenceLevel = 'In Vitro';
      else if (sectionTitle?.includes('OTHER')) evidenceLevel = 'Review/Meta';
      else if (journal?.toLowerCase().includes('preprint') || journal?.toLowerCase().includes('biorxiv')) evidenceLevel = 'Preprint';

      // Pick emoji for hero
      const categoryEmoji = getCategoryEmoji(category);
      const heroEmojis = {
        'research': ['🔬', '🧪', '📊', '🧫', '🔭'],
        'supplements': ['💊', '🧬', '⚗️', '💉', '🌿'],
        'protocols': ['🏋️', '🧊', '🔥', '🍽️', '🧘'],
        'news': ['📰', '📡', '🌍', '📢', '💡'],
      };
      const emojis = heroEmojis[category] || heroEmojis.research;
      const heroEmoji = emojis[i % emojis.length];

      articles.push({
        id: i + '-' + title.slice(0, 20).replace(/\s/g, '-'),
        title,
        summary: abstract.slice(0, 300) + (abstract.length > 300 ? '...' : ''),
        fullAbstract: abstract,
        journal,
        doi,
        category,
        evidenceLevel,
        sectionType: sectionTitle,
        relatedProduct,
        heroEmoji,
        gradient: getCategoryGradient(category),
      });
    }
  }

  return articles;
}

function ArticleCard({ article, onClick }) {
  const gradeColor = article.relatedProduct 
    ? getGradeColor(article.relatedProduct.evidenceGrade)
    : null;

  return (
    <article
      onClick={() => onClick(article)}
      className="glass-card-hover overflow-hidden cursor-pointer group"
    >
      {/* Hero gradient */}
      <div className={`h-40 bg-gradient-to-br ${article.gradient} relative flex items-center justify-center overflow-hidden`}>
        <span className="text-6xl opacity-30 group-hover:opacity-60 group-hover:scale-110 transition-all duration-500">
          {article.heroEmoji}
        </span>
        
        {/* Evidence badge */}
        <div className="absolute top-3 right-3">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/40 backdrop-blur-sm text-white/80">
            {article.evidenceLevel}
          </span>
        </div>

        {/* Category tag */}
        <div className="absolute bottom-3 left-3">
          <span className="category-badge bg-black/40 backdrop-blur-sm text-white/80">
            {article.category}
          </span>
        </div>
      </div>

      <div className="p-5">
        {/* Related product badge */}
        {article.relatedProduct && (
          <div className="flex items-center gap-2 mb-3">
            <span className={`grade-badge ${gradeColor.class} text-[10px]`}>
              Grade {article.relatedProduct.evidenceGrade}
            </span>
            <span className="text-xs text-muted">
              Related: {article.relatedProduct.name}
            </span>
          </div>
        )}

        <h3 className="font-semibold text-white group-hover:text-accent transition-colors mb-2 line-clamp-2 leading-snug">
          {article.title}
        </h3>

        <p className="text-sm text-muted line-clamp-3 mb-3 leading-relaxed">
          {article.summary}
        </p>

        {/* Journal */}
        {article.journal && (
          <div className="flex items-center gap-2 text-xs text-muted/70">
            <span>📄</span>
            <span className="truncate">{article.journal}</span>
          </div>
        )}
      </div>
    </article>
  );
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto glass-card animate-fade-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-bg-hover text-muted hover:text-white hover:bg-bg-elevated transition-all z-10"
        >
          ✕
        </button>

        {/* Hero */}
        <div className={`h-48 bg-gradient-to-br ${article.gradient} flex items-center justify-center`}>
          <span className="text-7xl opacity-40">{article.heroEmoji}</span>
        </div>

        <div className="p-8">
          {/* Meta */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-accent/10 text-accent">
              {article.evidenceLevel}
            </span>
            <span className="category-badge">{article.category}</span>
            {article.relatedProduct && (
              <span className={`grade-badge ${getGradeColor(article.relatedProduct.evidenceGrade).class}`}>
                Grade {article.relatedProduct.evidenceGrade}
              </span>
            )}
          </div>

          <h2 className="text-2xl font-bold text-white mb-4 leading-snug">{article.title}</h2>

          {article.journal && (
            <p className="text-sm text-accent mb-2">📄 {article.journal}</p>
          )}
          {article.doi && (
            <a
              href={`https://doi.org/${article.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted hover:text-accent transition-colors inline-flex items-center gap-1 mb-6"
            >
              🔗 DOI: {article.doi} ↗
            </a>
          )}

          <div className="mt-6 pt-6 border-t border-border/30">
            <h3 className="text-sm font-semibold text-white mb-3">Abstract</h3>
            <p className="text-zinc-300 leading-relaxed">{article.fullAbstract}</p>
          </div>

          {article.relatedProduct && (
            <div className="mt-6 pt-6 border-t border-border/30">
              <h3 className="text-sm font-semibold text-white mb-3">Related Product</h3>
              <div className="glass-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-white">{article.relatedProduct.name}</span>
                    <p className="text-sm text-muted mt-1">{article.relatedProduct.description}</p>
                  </div>
                  <span className={`grade-badge ${getGradeColor(article.relatedProduct.evidenceGrade).class}`}>
                    {article.relatedProduct.evidenceGrade}
                  </span>
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
        const parsed = parseDigestToArticles(digest, prods);
        setArticles(parsed);
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
    <div className="page-enter">
      {/* Header */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-8 relative">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">📰</span>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">Discover</h1>
          </div>
          <p className="text-muted max-w-2xl">
            Latest longevity research curated by our AI agents from PubMed, bioRxiv, and leading journals.
          </p>

          {/* Category filters */}
          <div className="flex flex-wrap gap-2 mt-6">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeCategory === cat
                    ? 'bg-accent/15 text-accent border border-accent/30'
                    : 'bg-bg-card border border-border/50 text-muted hover:text-white hover:border-border'
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                {cat !== 'all' && (
                  <span className="ml-2 text-xs opacity-60">
                    {articles.filter(a => cat === 'all' || a.category === cat).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Articles grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="glass-card overflow-hidden animate-pulse">
                <div className="h-40 bg-bg-hover" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-bg-hover rounded w-3/4" />
                  <div className="h-3 bg-bg-hover rounded w-full" />
                  <div className="h-3 bg-bg-hover rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-5xl mb-4 block">🔍</span>
            <p className="text-muted">No articles found in this category yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                onClick={setSelectedArticle}
              />
            ))}
          </div>
        )}
      </section>

      {/* Article detail modal */}
      {selectedArticle && (
        <ArticleDetail
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
        />
      )}
    </div>
  );
}
