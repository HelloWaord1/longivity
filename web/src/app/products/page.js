'use client';

import { useState, useEffect, useMemo } from 'react';
import { fetchProducts } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import ProductModal from '@/components/ProductModal';
import { useDebounce } from '@/lib/hooks';

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

  const hasFilters = gradeFilter !== 'all' || categoryFilter !== 'all' || debouncedSearch;

  return (
    <div className="animate-fade-in">
      <section className="max-w-3xl mx-auto px-4 md:px-6 pt-10 pb-6">
        <h1 className="text-2xl font-semibold text-primary mb-1">Products</h1>
        <p className="text-sm text-secondary">
          {products.length} evidence-graded longevity supplements, protocols, and pharmaceuticals.
        </p>
      </section>

      {/* Filters */}
      <section className="max-w-3xl mx-auto px-4 md:px-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2.5 bg-bg-card border border-border rounded-lg text-sm text-primary placeholder:text-tertiary focus:outline-none focus:border-secondary transition-colors duration-150"
            />
          </div>

          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="px-3 py-2.5 bg-bg-card border border-border rounded-lg text-sm text-secondary focus:outline-none focus:border-secondary transition-colors duration-150 appearance-none cursor-pointer"
          >
            <option value="all">All grades</option>
            <option value="A">Grade A</option>
            <option value="B">Grade B</option>
            <option value="C">Grade C</option>
            <option value="D">Grade D</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2.5 bg-bg-card border border-border rounded-lg text-sm text-secondary focus:outline-none focus:border-secondary transition-colors duration-150 appearance-none cursor-pointer"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {hasFilters && (
          <div className="flex items-center gap-3 mt-3 text-xs text-tertiary">
            <span>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
            <button
              onClick={() => { setGradeFilter('all'); setCategoryFilter('all'); setSearch(''); }}
              className="text-accent hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </section>

      {/* Products grid */}
      <section className="max-w-3xl mx-auto px-4 md:px-6 pb-16">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="p-4 bg-bg-card border border-border rounded-lg">
                <div className="h-4 bg-bg-hover rounded w-2/3 mb-2" />
                <div className="h-3 bg-bg-hover rounded w-full" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-secondary text-sm">No products found.</p>
            <p className="text-tertiary text-xs mt-1">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

      {selectedProduct && (
        <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
    </div>
  );
}
