'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import SearchBar from '@/components/SearchBar';
import ProductCard from '@/components/ProductCard';
import ProductModal from '@/components/ProductModal';
import TypewriterText from '@/components/TypewriterText';
import LoadingPulse from '@/components/LoadingPulse';
import { consultAI, fetchProducts } from '@/lib/api';

const SUGGESTIONS = [
  'How to boost NAD+ levels?',
  'Best senolytics for age 30?',
  'NMN vs NR — which is better?',
  'Top supplements for brain health',
  'Affordable longevity stack under $50',
  'How does autophagy work?',
];

function formatAnswer(data) {
  if (!data) return '';

  if (data.relevantProducts && data.relevantProducts.length > 0) {
    let text = `Found ${data.count} relevant product${data.count !== 1 ? 's' : ''}:\n\n`;

    for (const p of data.relevantProducts) {
      text += `### ${p.name}\n`;
      text += `**Evidence:** ${p.evidenceGrade} · **Risk:** ${p.riskProfile || 'N/A'}\n\n`;

      if (p.mechanisms && p.mechanisms.length > 0) {
        text += `**Mechanisms:** ${p.mechanisms.join(', ')}\n\n`;
      }

      const dosage = typeof p.dosage === 'string' ? p.dosage : p.dosage?.standard;
      if (dosage) {
        text += `**Dosage:** ${dosage}\n\n`;
      }

      if (p.keyFindings && p.keyFindings.length > 0) {
        text += `**Key findings:**\n`;
        for (const f of p.keyFindings) {
          text += `- ${f}\n`;
        }
        text += '\n';
      }
    }

    text += `---\n\n${data.note || 'This is not medical advice. Consult a healthcare professional.'}`;
    return text;
  }

  return `No specific products found for this query yet. Our research coverage is expanding.\n\nTry searching for: **NMN, NAD+, rapamycin, senolytics, omega-3, taurine, spermidine, metformin, resveratrol,** or **urolithin A**.`;
}

function generateFollowUps(query, data) {
  if (data?.relevantProducts?.length > 0) {
    const product = data.relevantProducts[0];
    return [
      `Mechanisms of ${product.name}?`,
      `Best dosage for ${product.name}?`,
      `What combines well with ${product.name}?`,
    ];
  }
  return [
    'What are the side effects?',
    'How does this compare to alternatives?',
    'What does the latest research say?',
  ];
}

export default function HomePage() {
  const [searchState, setSearchState] = useState('idle');
  const [answer, setAnswer] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [currentQuery, setCurrentQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const resultRef = useRef(null);

  useEffect(() => {
    fetchProducts().then(setAllProducts).catch(() => {});
  }, []);

  const handleSearch = async (query) => {
    setCurrentQuery(query);
    setSearchState('loading');
    setAnswer(null);
    setAnswerText('');

    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    try {
      const data = await consultAI(query);
      if (data.relevantProducts) {
        data.relevantProducts = data.relevantProducts.map(p => {
          const full = allProducts.find(fp => fp.name === p.name);
          return full ? { ...full, ...p } : p;
        });
      }
      setAnswer(data);
      setAnswerText(formatAnswer(data));
      setSearchState('done');
    } catch (err) {
      setAnswerText('Something went wrong. Please try again.');
      setSearchState('done');
    }
  };

  const productCount = allProducts.length || 48;

  return (
    <div className="animate-fade-in">
      {/* Hero / idle state */}
      {searchState === 'idle' && (
        <section className="px-4 md:px-6 pt-24 pb-12 md:pt-32 md:pb-16">
          <div className="max-w-xl mx-auto">
            {/* Hero */}
            <div className="text-center mb-8">
              <h1 className="text-[36px] md:text-[56px] font-bold text-primary leading-[1.1] tracking-tight mb-3">
                Longevity research, answered
              </h1>
              <p className="text-sm md:text-base text-secondary">
                Evidence-graded supplements, protocols, and the latest science.
              </p>
            </div>

            {/* Search */}
            <div className="mb-5">
              <SearchBar onSearch={handleSearch} autoFocus />
            </div>

            {/* Suggestions — 2 col grid on mobile */}
            <div className="grid grid-cols-2 md:flex md:flex-wrap md:justify-center gap-2 mb-12">
              {SUGGESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSearch(q)}
                  className="text-xs px-3 py-2 border border-border rounded-lg text-tertiary hover:text-secondary hover:border-secondary/30 transition-colors duration-150 text-left md:text-center"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Stats strip */}
            <div className="flex items-center justify-center gap-6 md:gap-10 py-4 border-t border-b border-border/60 mb-10">
              <div className="text-center">
                <div className="text-lg md:text-xl font-semibold text-primary">{productCount}</div>
                <div className="text-[11px] text-tertiary uppercase tracking-wider">Products</div>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center">
                <div className="text-lg md:text-xl font-semibold text-primary">44+</div>
                <div className="text-[11px] text-tertiary uppercase tracking-wider">Papers</div>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center">
                <div className="text-lg md:text-xl font-semibold text-primary">A–D</div>
                <div className="text-[11px] text-tertiary uppercase tracking-wider">Grades</div>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center">
                <div className="text-lg md:text-xl font-semibold text-primary">24/7</div>
                <div className="text-[11px] text-tertiary uppercase tracking-wider">Monitoring</div>
              </div>
            </div>

            {/* Section links */}
            <div className="grid grid-cols-1 gap-2">
              {[
                { title: 'Discover', desc: 'Latest longevity research from PubMed and bioRxiv', href: '/discover' },
                { title: 'Products', desc: `${productCount} evidence-graded supplements and protocols`, href: '/products' },
                { title: 'Stack Builder', desc: 'Get a personalized longevity stack for your budget', href: '/stack' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-bg-hover transition-colors duration-150 group"
                >
                  <div>
                    <h3 className="text-sm font-medium text-primary mb-0.5">{item.title}</h3>
                    <p className="text-xs text-tertiary">{item.desc}</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-tertiary group-hover:text-secondary transition-colors shrink-0 ml-4">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Sticky search when not idle */}
      {searchState !== 'idle' && (
        <div className="sticky top-14 z-40 bg-bg border-b border-border py-3 px-4 md:px-6">
          <SearchBar onSearch={handleSearch} />
        </div>
      )}

      {/* Results */}
      {searchState !== 'idle' && (
        <section ref={resultRef} className="max-w-3xl mx-auto px-4 md:px-6 py-8">
          <h2 className="text-base font-medium text-primary mb-6">{currentQuery}</h2>

          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 min-w-0">
              {searchState === 'loading' ? (
                <div className="py-6">
                  <LoadingPulse text="Searching knowledge base..." />
                  <div className="mt-6 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-3 bg-bg-hover rounded" style={{ width: `${85 - i * 15}%` }} />
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <TypewriterText text={answerText} />
                </div>
              )}

              {/* Follow-ups */}
              {searchState === 'done' && (
                <div className="mt-8 pt-6 border-t border-border">
                  <p className="text-xs text-tertiary uppercase tracking-wider font-medium mb-3">Related</p>
                  <div className="flex flex-wrap gap-2">
                    {generateFollowUps(currentQuery, answer).map((q, i) => (
                      <button
                        key={i}
                        onClick={() => handleSearch(q)}
                        className="text-xs px-3 py-1.5 border border-border rounded-md text-secondary hover:text-primary hover:border-secondary/30 transition-colors duration-150"
                      >
                        {q}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => { setSearchState('idle'); setAnswer(null); setAnswerText(''); }}
                    className="mt-4 text-xs text-tertiary hover:text-accent transition-colors duration-150"
                  >
                    &larr; New search
                  </button>
                </div>
              )}
            </div>

            {/* Sources sidebar */}
            {searchState === 'done' && answer?.relevantProducts?.length > 0 && (
              <aside className="lg:w-64 shrink-0">
                <div className="lg:sticky lg:top-32">
                  <p className="text-xs text-tertiary uppercase tracking-wider font-medium mb-3">Sources</p>
                  <div className="space-y-2">
                    {answer.relevantProducts.map((p, i) => (
                      <ProductCard key={i} product={p} onClick={setSelectedProduct} compact />
                    ))}
                  </div>
                </div>
              </aside>
            )}
          </div>
        </section>
      )}

      {selectedProduct && (
        <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
    </div>
  );
}
