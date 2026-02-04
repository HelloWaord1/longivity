'use client';

import { useState, useEffect, useMemo } from 'react';
import { fetchProducts, getGradeColor } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import ProductModal from '@/components/ProductModal';
import { useDebounce } from '@/lib/hooks';

const GRADES = ['all', 'A', 'B', 'C', 'D'];

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const debouncedSearch = useDebounce(search, 200);

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const cats = [...new Set(products.map(p => p.category))];
    return ['all', ...cats.sort()];
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = !debouncedSearch ||
        p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        p.description?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        p.tags?.some(t => t.toLowerCase().includes(debouncedSearch.toLowerCase()));
      
      const matchesGrade = gradeFilter === 'all' || p.evidenceGrade === gradeFilter;
      const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
      
      return matchesSearch && matchesGrade && matchesCategory;
    });
  }, [products, debouncedSearch, gradeFilter, categoryFilter]);

  // Group by grade for overview
  const gradeCounts = useMemo(() => {
    const counts = { A: 0, B: 0, C: 0, D: 0 };
    products.forEach(p => {
      const g = p.evidenceGrade?.toUpperCase();
      if (counts[g] !== undefined) counts[g]++;
    });
    return counts;
  }, [products]);

  return (
    <div className="page-enter">
      {/* Header */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-transparent pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-8 relative">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">💊</span>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">Products</h1>
          </div>
          <p className="text-muted max-w-2xl">
            {products.length} evidence-graded longevity supplements, protocols, and pharmaceuticals.
          </p>

          {/* Grade overview cards */}
          <div className="grid grid-cols-4 gap-3 mt-6 max-w-lg">
            {GRADES.filter(g => g !== 'all').map((g) => {
              const color = getGradeColor(g);
              return (
                <button
                  key={g}
                  onClick={() => setGradeFilter(gradeFilter === g ? 'all' : g)}
                  className={`p-3 rounded-xl border text-center transition-all duration-200 ${
                    gradeFilter === g
                      ? `border-current ${color.text} bg-current/10`
                      : 'border-border/50 bg-bg-card hover:border-border'
                  }`}
                >
                  <div className={`text-2xl font-bold ${color.text}`}>{gradeCounts[g]}</div>
                  <div className="text-xs text-muted mt-0.5">Grade {g}</div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products, mechanisms, tags..."
              className="w-full pl-11 pr-4 py-3 bg-bg-card border border-border/50 rounded-xl text-white text-sm placeholder:text-muted/60 focus:outline-none focus:border-accent/50 transition-all"
            />
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  categoryFilter === cat
                    ? 'bg-accent/15 text-accent border border-accent/30'
                    : 'bg-bg-card border border-border/50 text-muted hover:text-white hover:border-border'
                }`}
              >
                {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Active filters display */}
        {(gradeFilter !== 'all' || categoryFilter !== 'all' || debouncedSearch) && (
          <div className="flex items-center gap-2 mt-4 text-sm">
            <span className="text-muted">Showing {filtered.length} results</span>
            {gradeFilter !== 'all' && (
              <button
                onClick={() => setGradeFilter('all')}
                className={`grade-badge ${getGradeColor(gradeFilter).class} cursor-pointer hover:opacity-80`}
              >
                Grade {gradeFilter} ✕
              </button>
            )}
            {categoryFilter !== 'all' && (
              <button
                onClick={() => setCategoryFilter('all')}
                className="category-badge cursor-pointer hover:opacity-80"
              >
                {categoryFilter} ✕
              </button>
            )}
            {debouncedSearch && (
              <button
                onClick={() => setSearch('')}
                className="category-badge cursor-pointer hover:opacity-80"
              >
                &quot;{debouncedSearch}&quot; ✕
              </button>
            )}
            <button
              onClick={() => { setGradeFilter('all'); setCategoryFilter('all'); setSearch(''); }}
              className="text-accent hover:underline ml-2"
            >
              Clear all
            </button>
          </div>
        )}
      </section>

      {/* Products grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="glass-card overflow-hidden animate-pulse">
                <div className="h-24 bg-bg-hover" />
                <div className="p-5 space-y-3">
                  <div className="flex gap-2">
                    <div className="h-5 w-16 bg-bg-hover rounded-full" />
                    <div className="h-5 w-20 bg-bg-hover rounded-full" />
                  </div>
                  <div className="h-4 bg-bg-hover rounded w-3/4" />
                  <div className="h-3 bg-bg-hover rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-5xl mb-4 block">🔍</span>
            <p className="text-muted text-lg mb-2">No products found</p>
            <p className="text-muted/60 text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((product) => (
              <ProductCard
                key={product.slug || product.name}
                product={product}
                onClick={setSelectedProduct}
              />
            ))}
          </div>
        )}
      </section>

      {/* Product modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}
