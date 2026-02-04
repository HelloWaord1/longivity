'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import SearchBar from '@/components/SearchBar';
import ProductCard from '@/components/ProductCard';
import ProductModal from '@/components/ProductModal';
import TypewriterText from '@/components/TypewriterText';
import LoadingPulse from '@/components/LoadingPulse';
import { consultAI, fetchProducts, getGradeColor, getCategoryEmoji } from '@/lib/api';

const SUGGESTED_QUESTIONS = [
  'How to boost NAD+ levels?',
  'Best senolytics for age 30?',
  'NMN vs NR — which is better?',
  'Top supplements for brain health?',
  'What is rapamycin used for?',
  'Affordable longevity stack under $50?',
  'How does autophagy work?',
  'Best evidence-based anti-aging protocols?',
];

function SourcesSidebar({ products, onProductClick }) {
  if (!products || products.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted uppercase tracking-wider flex items-center gap-2">
        <span>📋</span> Sources & Products
      </h3>
      {products.map((p, i) => (
        <ProductCard key={i} product={p} onClick={onProductClick} compact />
      ))}
    </div>
  );
}

function FollowUpQuestions({ questions, onSelect }) {
  if (!questions || questions.length === 0) return null;

  return (
    <div className="mt-6">
      <h4 className="text-sm font-medium text-muted mb-3">Follow-up questions</h4>
      <div className="flex flex-wrap gap-2">
        {questions.map((q, i) => (
          <button
            key={i}
            onClick={() => onSelect(q)}
            className="text-sm px-4 py-2 rounded-xl bg-bg-hover border border-border/50 text-zinc-300 
                       hover:border-accent/30 hover:text-accent transition-all duration-200"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

function formatAnswer(data) {
  if (!data) return '';
  
  if (data.relevantProducts && data.relevantProducts.length > 0) {
    let text = `I found **${data.count} relevant product${data.count !== 1 ? 's' : ''}** matching your query:\n\n`;
    
    for (const p of data.relevantProducts) {
      text += `### ${p.name}\n`;
      text += `**Evidence Grade:** ${p.evidenceGrade} · **Risk:** ${p.riskProfile || 'N/A'}\n\n`;
      
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
    
    text += `---\n\n⚠️ ${data.note || 'This is not medical advice. Consult a healthcare professional.'}`;
    return text;
  }
  
  return `I don't have specific products matching your query in my knowledge base yet. Our research agents are continuously expanding coverage.\n\nTry asking about: **NMN, NAD+, rapamycin, senolytics, omega-3, taurine, spermidine, metformin, resveratrol,** or **urolithin A**.`;
}

function generateFollowUps(query, data) {
  const base = [
    'What are the side effects?',
    'How does this compare to alternatives?',
    'What does the latest research say?',
  ];
  
  if (data?.relevantProducts?.length > 0) {
    const product = data.relevantProducts[0];
    return [
      `What are the mechanisms of ${product.name}?`,
      `Best dosage for ${product.name}?`,
      `What can I combine with ${product.name}?`,
    ];
  }
  
  return base;
}

function renderMarkdown(text) {
  if (!text) return '';
  
  return text
    .replace(/### (.*?)$/gm, '<h3 class="text-base font-semibold text-white mt-4 mb-1">$1</h3>')
    .replace(/## (.*?)$/gm, '<h2 class="text-lg font-semibold text-white mt-4 mb-2">$1</h2>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/^- (.*?)$/gm, '<li class="ml-4 text-zinc-300">$1</li>')
    .replace(/^---$/gm, '<hr class="border-border/30 my-4" />')
    .replace(/\n\n/g, '</p><p class="mb-2 text-zinc-300">')
    .replace(/\n/g, '<br />')
    .replace(/^/, '<p class="mb-2 text-zinc-300">')
    .replace(/$/, '</p>');
}

export default function HomePage() {
  const [searchState, setSearchState] = useState('idle'); // idle | loading | done
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
      
      // Enrich with full product data
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
      setAnswerText('Sorry, something went wrong. Please try again.');
      setSearchState('done');
    }
  };

  return (
    <div className="page-enter">
      {/* Hero section */}
      {searchState === 'idle' && (
        <section className="min-h-[85vh] flex flex-col items-center justify-center px-4">
          {/* Background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="relative text-center mb-10 animate-fade-up">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-bg-card border border-border/50 rounded-full text-sm text-accent mb-6">
              <span>🔬</span> AI-Powered Longevity Intelligence
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1.1]">
              <span className="gradient-text">Ask anything</span>
              <br />
              <span className="text-white">about longevity</span>
            </h1>
            
            <p className="text-lg text-muted max-w-xl mx-auto mb-10">
              Evidence-graded research, personalized supplement stacks, and the latest 
              science — powered by multi-agent AI.
            </p>
          </div>

          <div className="w-full max-w-2xl mx-auto animate-fade-up" style={{ animationDelay: '200ms' }}>
            <SearchBar onSearch={handleSearch} large autoFocus />
          </div>

          {/* Suggested questions */}
          <div className="mt-8 animate-fade-up" style={{ animationDelay: '400ms' }}>
            <p className="text-sm text-muted text-center mb-3">Try asking:</p>
            <div className="flex flex-wrap justify-center gap-2 max-w-2xl">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSearch(q)}
                  className="text-sm px-4 py-2 rounded-xl bg-bg-card/80 border border-border/50 text-zinc-400 
                             hover:border-accent/30 hover:text-accent hover:bg-bg-hover transition-all duration-200"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Stats bar */}
          <div className="mt-16 flex flex-wrap justify-center gap-8 animate-fade-up" style={{ animationDelay: '600ms' }}>
            {[
              { value: '48+', label: 'Products Graded' },
              { value: '44+', label: 'Papers Indexed' },
              { value: 'A-D', label: 'Evidence Grades' },
              { value: '24/7', label: 'AI Monitoring' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold text-accent">{stat.value}</div>
                <div className="text-xs text-muted mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Search bar when not idle */}
      {searchState !== 'idle' && (
        <div className="sticky top-16 z-40 bg-bg/90 backdrop-blur-xl border-b border-border/30 py-4 px-4">
          <SearchBar onSearch={handleSearch} />
        </div>
      )}

      {/* Results */}
      {searchState !== 'idle' && (
        <section ref={resultRef} className="max-w-7xl mx-auto px-4 py-8">
          {/* Query display */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <span className="text-accent">🔍</span> {currentQuery}
            </h2>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main answer */}
            <div className="flex-1 min-w-0">
              <div className="glass-card p-6">
                {searchState === 'loading' ? (
                  <div className="py-8">
                    <LoadingPulse text="Searching knowledge base..." />
                    <div className="mt-4 space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-4 bg-bg-hover rounded animate-pulse" 
                             style={{ width: `${80 - i * 15}%`, animationDelay: `${i * 200}ms` }} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="prose-answer">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/30">
                      <span className="text-lg">🧬</span>
                      <span className="text-sm font-medium text-accent">Longivity AI</span>
                    </div>
                    <TypewriterText
                      text={answerText}
                      speed={8}
                      className=""
                    />
                  </div>
                )}
              </div>

              {/* Follow-up questions */}
              {searchState === 'done' && (
                <FollowUpQuestions
                  questions={generateFollowUps(currentQuery, answer)}
                  onSelect={handleSearch}
                />
              )}

              {/* Back to search */}
              {searchState === 'done' && (
                <button
                  onClick={() => { setSearchState('idle'); setAnswer(null); setAnswerText(''); }}
                  className="mt-6 text-sm text-muted hover:text-accent transition-colors flex items-center gap-2"
                >
                  ← New search
                </button>
              )}
            </div>

            {/* Sources sidebar */}
            {searchState === 'done' && answer?.relevantProducts?.length > 0 && (
              <aside className="lg:w-80 shrink-0">
                <div className="lg:sticky lg:top-36">
                  <SourcesSidebar
                    products={answer.relevantProducts}
                    onProductClick={setSelectedProduct}
                  />
                </div>
              </aside>
            )}
          </div>
        </section>
      )}

      {/* Quick links when idle */}
      {searchState === 'idle' && (
        <section className="max-w-7xl mx-auto px-4 py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: '📰',
                title: 'Discover',
                desc: 'Latest longevity research digest, curated by AI agents from PubMed and bioRxiv.',
                href: '/discover',
                color: 'from-blue-500/10 to-purple-500/10',
              },
              {
                icon: '💊',
                title: 'Products',
                desc: '48+ evidence-graded supplements, protocols, and pharmaceuticals for longevity.',
                href: '/products',
                color: 'from-cyan-500/10 to-teal-500/10',
              },
              {
                icon: '🧪',
                title: 'Stack Builder',
                desc: 'Get a personalized supplement stack based on your budget, age, and goals.',
                href: '/stack',
                color: 'from-green-500/10 to-emerald-500/10',
              },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="glass-card-hover group overflow-hidden">
                <div className={`h-32 bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                  <span className="text-5xl opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300">
                    {item.icon}
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white group-hover:text-accent transition-colors mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Product modal */}
      {selectedProduct && (
        <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
    </div>
  );
}
