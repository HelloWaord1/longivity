'use client';

import { useState, useEffect, useRef } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://longivity-production.up.railway.app';

function Nav() {
  return (
    <nav className="nav">
      <div className="nav-logo">🧬 Longivity</div>
      <ul className="nav-links">
        <li><a href="#products">Products</a></li>
        <li><a href="#consult">Ask AI</a></li>
        <li><a href="#recommend">My Stack</a></li>
        <li><a href="#digest">Research</a></li>
      </ul>
    </nav>
  );
}

function Hero() {
  return (
    <section className="hero">
      <div className="hero-badge">🔬 AI-Powered Longevity Platform</div>
      <h1>Live Longer,<br />Live Better</h1>
      <p>
        Multi-agent AI system that monitors all longevity research, supplements, and protocols — 
        then builds your personalized stack based on your health data and budget.
      </p>
      <div className="hero-actions">
        <a href="#recommend" className="btn btn-primary">Get Your Stack →</a>
        <a href="#consult" className="btn btn-secondary">Ask About Longevity</a>
      </div>
      <div className="stats">
        <div className="stat">
          <div className="stat-value">$20.2B</div>
          <div className="stat-label">Global Longevity Market by 2033</div>
        </div>
        <div className="stat">
          <div className="stat-value">44+</div>
          <div className="stat-label">Research Papers Indexed</div>
        </div>
        <div className="stat">
          <div className="stat-value">10</div>
          <div className="stat-label">Evidence-Graded Products</div>
        </div>
        <div className="stat">
          <div className="stat-value">24/7</div>
          <div className="stat-label">AI Monitoring</div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    {
      icon: '🔍',
      title: 'Multi-Agent Research',
      desc: 'AI agents continuously monitor PubMed, bioRxiv, supplement markets, and biohacker communities for the latest longevity science.',
    },
    {
      icon: '🧬',
      title: 'Evidence Grading',
      desc: 'Every product and protocol rated A-D based on scientific evidence: RCTs, meta-analyses, cohort studies, and more.',
    },
    {
      icon: '🤖',
      title: 'AI Personalization',
      desc: 'Your AI agent builds a unique stack based on your health data, genetics, and budget — from $10 to $100,000+/month.',
    },
    {
      icon: '📦',
      title: 'Monthly Delivery',
      desc: 'Personalized box delivered monthly. Your stack adapts as new research emerges and your health data changes.',
    },
    {
      icon: '👨‍⚕️',
      title: 'Expert Verified',
      desc: 'Every protocol reviewed by verified gerontologists, biochemists, and clinical researchers before recommendation.',
    },
    {
      icon: '🌐',
      title: 'Works with Any AI',
      desc: 'Connect via MCP (Claude), REST API (ChatGPT/Gemini), or use our web interface directly.',
    },
  ];

  return (
    <section className="section container">
      <h2 className="section-title">How It Works</h2>
      <p className="section-subtitle">
        Not another supplement brand — an AI aggregator that picks the best from the entire market.
      </p>
      <div className="features">
        {features.map((f, i) => (
          <div key={i} className="feature-card">
            <div className="feature-icon">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Products() {
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetch(`${API}/products`)
      .then(r => r.json())
      .then(d => setProducts(d.products || []))
      .catch(console.error);
  }, []);

  const gradeClass = (g) => `badge badge-grade-${g?.toLowerCase() || 'd'}`;

  return (
    <section id="products" className="section container">
      <h2 className="section-title">Knowledge Base</h2>
      <p className="section-subtitle">
        Evidence-graded longevity products monitored by our AI agents.
      </p>
      <div className="products-grid">
        {products.map((p, i) => (
          <div key={i} className="product-card" onClick={() => setSelected(p.name)}>
            <div className="product-name">{p.name}</div>
            <div className="product-meta">
              <span className={gradeClass(p.evidenceGrade)}>Grade {p.evidenceGrade}</span>
              <span className="badge badge-category">{p.category}</span>
            </div>
            <div className="product-desc">{p.description}</div>
          </div>
        ))}
      </div>
      {products.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Loading products...</p>}
    </section>
  );
}

function Consult() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hi! I\'m the Longivity AI. Ask me anything about longevity supplements, protocols, or anti-aging research. For example: "How to boost NAD+ levels?" or "What are senolytics?"' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEnd = useRef(null);

  const scrollToBottom = () => messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(scrollToBottom, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const query = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: query }]);
    setLoading(true);

    try {
      const res = await fetch(`${API}/consult`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();

      let reply = '';
      if (data.relevantProducts?.length > 0) {
        reply = `Found ${data.count} relevant product(s):\n\n`;
        for (const p of data.relevantProducts) {
          reply += `**${p.name}** (Grade ${p.evidenceGrade}, ${p.riskProfile} risk)\n`;
          reply += `Mechanisms: ${p.mechanisms?.join(', ')}\n`;
          reply += `Dosage: ${p.dosage?.standard || 'N/A'}\n`;
          if (p.keyFindings?.[0]) reply += `Key finding: ${p.keyFindings[0]}\n`;
          reply += '\n';
        }
        reply += `⚠️ ${data.note}`;
      } else {
        reply = `I don't have specific products matching "${query}" in my knowledge base yet. Our research agents are continuously expanding coverage. Try asking about: NMN, NAD+, rapamycin, senolytics, omega-3, taurine, spermidine, metformin, resveratrol, or urolithin A.`;
      }

      setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, something went wrong. Please try again.' }]);
    }
    setLoading(false);
  };

  return (
    <section id="consult" className="section container">
      <h2 className="section-title">Ask Longivity AI</h2>
      <p className="section-subtitle">
        Your longevity questions, answered with evidence-graded research.
      </p>
      <div className="chat-container">
        <div className="chat-messages">
          {messages.map((m, i) => (
            <div key={i} className={`chat-message ${m.role}`}>
              <div className="role">{m.role === 'user' ? '🧑 You' : '🧬 Longivity'}</div>
              <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
            </div>
          ))}
          {loading && (
            <div className="chat-message assistant">
              <div className="role">🧬 Longivity</div>
              <div>Searching knowledge base...</div>
            </div>
          )}
          <div ref={messagesEnd} />
        </div>
        <div className="chat-input-wrap">
          <input
            className="chat-input"
            placeholder="Ask about longevity..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
          />
          <button className="btn btn-primary" onClick={send} disabled={loading}>
            Send
          </button>
        </div>
      </div>
    </section>
  );
}

function Recommend() {
  const [budget, setBudget] = useState(50);
  const [age, setAge] = useState(30);
  const [stack, setStack] = useState(null);
  const [loading, setLoading] = useState(false);

  const getStack = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ budget, age }),
      });
      const data = await res.json();
      setStack(data.stack);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <section id="recommend" className="section container">
      <h2 className="section-title">Build Your Stack</h2>
      <p className="section-subtitle">
        Get a personalized longevity stack based on your budget. Every stack is optimized for maximum impact per dollar.
      </p>
      <div className="recommend-form">
        <div>
          <label style={{ fontSize: 14, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Monthly Budget (USD)</label>
          <input
            type="number"
            value={budget}
            onChange={e => setBudget(Number(e.target.value))}
            min={10}
            max={100000}
            style={{ width: 150 }}
          />
        </div>
        <div>
          <label style={{ fontSize: 14, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Age</label>
          <input
            type="number"
            value={age}
            onChange={e => setAge(Number(e.target.value))}
            min={18}
            max={100}
            style={{ width: 100 }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button className="btn btn-primary" onClick={getStack} disabled={loading}>
            {loading ? 'Building...' : 'Get My Stack →'}
          </button>
        </div>
      </div>

      {stack && (
        <div>
          <div className="stack-tier">
            {stack.tier} Tier — {stack.itemCount} products for ${stack.monthlyBudget}/month
          </div>
          {stack.items?.map((item, i) => (
            <div key={i} className="stack-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <strong style={{ fontSize: 18 }}>{item.name}</strong>
                <span className={`badge badge-grade-${item.evidenceGrade?.toLowerCase()}`}>
                  Grade {item.evidenceGrade}
                </span>
              </div>
              <div style={{ color: 'var(--accent)', fontSize: 14, marginBottom: 4 }}>
                💊 {item.dosage}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                {item.reasoning}
              </div>
            </div>
          ))}
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 16 }}>
            ⚠️ This is not medical advice. Consult a healthcare professional before starting any supplement regimen.
          </p>
        </div>
      )}
    </section>
  );
}

function Digest() {
  const [digest, setDigest] = useState(null);

  useEffect(() => {
    fetch(`${API}/digest`)
      .then(r => r.json())
      .then(d => setDigest(d.digest))
      .catch(console.error);
  }, []);

  return (
    <section id="digest" className="section container">
      <h2 className="section-title">Research Digest</h2>
      <p className="section-subtitle">
        Latest longevity research, curated by our AI agents from PubMed and bioRxiv.
      </p>
      {digest ? (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: 32,
          whiteSpace: 'pre-wrap',
          fontFamily: 'monospace',
          fontSize: 14,
          maxHeight: 600,
          overflow: 'auto',
          color: 'var(--text-muted)',
        }}>
          {digest}
        </div>
      ) : (
        <p style={{ color: 'var(--text-muted)' }}>Loading latest digest...</p>
      )}
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <p>🧬 Longivity — AI-powered longevity platform</p>
      <p style={{ marginTop: 8 }}>
        API: <a href={API}>{API}</a> · Built with OpenClaw
      </p>
      <p style={{ marginTop: 8 }}>
        © 2026 Longivity. Not medical advice.
      </p>
    </footer>
  );
}

export default function Home() {
  return (
    <>
      <Nav />
      <Hero />
      <Features />
      <Products />
      <Consult />
      <Recommend />
      <Digest />
      <Footer />
    </>
  );
}
