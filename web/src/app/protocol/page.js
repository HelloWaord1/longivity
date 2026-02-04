'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useProtocol } from '@/lib/ProtocolContext';
import { subscribeProtocol } from '@/lib/api';

function GradeDot({ grade }) {
  const colors = {
    A: 'bg-grade-a',
    B: 'bg-grade-b',
    C: 'bg-grade-c',
    D: 'bg-grade-d',
  };
  const g = (grade || 'D').toUpperCase();
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-secondary">
      <span className={`w-2 h-2 rounded-full ${colors[g] || colors.D}`} />
      {g}
    </span>
  );
}

export default function ProtocolPage() {
  const router = useRouter();
  const { items, total, removeFromProtocol, clearProtocol, protocol, mounted } = useProtocol();
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState('');
  const [showAgentInfo, setShowAgentInfo] = useState(false);

  if (!mounted) {
    return (
      <div className="animate-fade-in">
        <section className="max-w-3xl mx-auto px-4 md:px-6 pt-10 pb-16">
          <h1 className="text-2xl font-semibold text-primary mb-1">Your Protocol</h1>
          <p className="text-sm text-secondary">Loading...</p>
        </section>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="animate-fade-in">
        <section className="max-w-3xl mx-auto px-4 md:px-6 pt-10 pb-16">
          <h1 className="text-2xl font-semibold text-primary mb-1">Your Protocol</h1>
          <p className="text-sm text-secondary mb-6">
            Your personalized longevity protocol.
          </p>
          <div className="bg-bg-card border border-border rounded-lg p-6 text-center">
            <p className="text-sm text-secondary mb-4">No protocol built yet.</p>
            <p className="text-xs text-tertiary mb-6">
              Use the AI consultation to build a personalized stack based on your health goals, age, and budget.
            </p>
            <Link
              href="/stack"
              className="inline-flex items-center gap-2 px-5 py-3 bg-accent text-bg text-sm font-medium rounded-lg hover:bg-accent-hover transition-colors duration-150 min-h-[44px]"
            >
              Build your protocol
            </Link>
          </div>
        </section>
      </div>
    );
  }

  if (subscribed) {
    return (
      <div className="animate-fade-in">
        <section className="max-w-3xl mx-auto px-4 md:px-6 pt-10 pb-16">
          <h1 className="text-2xl font-semibold text-primary mb-4">
            Subscription Confirmed
          </h1>
          <div className="bg-bg-card border border-border rounded-lg p-6">
            <p className="text-sm text-secondary leading-relaxed mb-2">
              Your protocol subscription has been received. We will send updates and protocol adjustments to the email address you provided.
            </p>
            <p className="text-xs text-tertiary mb-4">
              Your protocol is a living document. As new research emerges, we will notify you of recommended changes.
            </p>
            <div className="flex items-center gap-4">
              <Link
                href="/products"
                className="text-sm text-accent hover:text-accent-hover transition-colors duration-150"
              >
                Browse products
              </Link>
              <Link
                href="/stack"
                className="text-sm text-accent hover:text-accent-hover transition-colors duration-150"
              >
                Update protocol
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const handleSubscribe = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await subscribeProtocol({
        email,
        protocol: {
          items: items.map((item) => ({
            name: item.name,
            slug: item.slug,
            dosage: item.dosage,
            monthlyCost: item.monthlyCost,
            evidenceGrade: item.evidenceGrade,
            reasoning: item.reasoning,
          })),
          goals: protocol.goals,
          budget: protocol.budget,
        },
      });
      setSubscribed(true);
    } catch (err) {
      setError('Failed to subscribe. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <section className="max-w-3xl mx-auto px-4 md:px-6 pt-10 pb-16">
        <h1 className="text-2xl font-semibold text-primary mb-1">Your Protocol</h1>
        <p className="text-sm text-secondary mb-6">
          Your personalized longevity stack, built by AI based on your health profile.
        </p>

        {/* Protocol metadata */}
        {(protocol.goals || protocol.budget || protocol.age) && (
          <div className="bg-bg-card border border-border rounded-lg p-4 mb-6">
            <div className="flex flex-wrap gap-4 text-xs text-tertiary">
              {protocol.goals && (
                <span>Goals: <span className="text-secondary">{protocol.goals}</span></span>
              )}
              {protocol.budget && (
                <span>Budget: <span className="text-secondary">{protocol.budget}</span></span>
              )}
              {protocol.age && (
                <span>Age: <span className="text-secondary">{protocol.age}</span></span>
              )}
            </div>
            {protocol.lastUpdated && (
              <p className="text-xs text-tertiary mt-2">
                Last updated: {new Date(protocol.lastUpdated).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        {/* Protocol items */}
        <div className="space-y-3 mb-6">
          {items.map((item) => (
            <div
              key={item.slug}
              className="bg-bg-card border border-border rounded-lg p-4 flex items-start justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-sm font-semibold text-primary truncate">
                    {item.name}
                  </h3>
                  <GradeDot grade={item.evidenceGrade} />
                </div>
                {item.dosage && (
                  <p className="text-xs text-secondary">{item.dosage}</p>
                )}
                {item.monthlyCost != null && (
                  <p className="text-xs text-tertiary mt-1">
                    ${item.monthlyCost}/month
                  </p>
                )}
                {item.reasoning && (
                  <p className="text-xs text-tertiary mt-1 leading-relaxed">
                    {item.reasoning}
                  </p>
                )}
              </div>
              <button
                onClick={() => removeFromProtocol(item.slug)}
                className="w-8 h-8 flex items-center justify-center text-tertiary hover:text-primary transition-colors duration-150 shrink-0"
                aria-label={`Remove ${item.name}`}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* Total */}
        {total > 0 && (
          <div className="flex items-center justify-between py-3 border-t border-border mb-6">
            <span className="text-sm font-medium text-primary">
              Monthly total
            </span>
            <span className="text-sm font-semibold text-primary">
              ${total.toFixed(2)}/month
            </span>
          </div>
        )}

        {/* Actions */}
        {!showSubscribe ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSubscribe(true)}
                className="flex-1 py-3 bg-accent text-bg text-sm font-medium rounded-lg hover:bg-accent-hover transition-colors duration-150 min-h-[44px]"
              >
                Subscribe to this protocol
              </button>
              <button
                onClick={clearProtocol}
                className="px-4 py-3 text-sm text-secondary hover:text-primary border border-border rounded-lg transition-colors duration-150 min-h-[44px]"
              >
                Clear
              </button>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/stack"
                className="flex-1 py-3 text-sm text-center font-medium text-secondary border border-border rounded-lg hover:text-primary hover:border-accent/30 transition-colors duration-150 min-h-[44px] flex items-center justify-center"
              >
                Update protocol
              </Link>
              <button
                onClick={() => setShowAgentInfo(!showAgentInfo)}
                className="flex-1 py-3 text-sm font-medium text-secondary border border-border rounded-lg hover:text-primary hover:border-accent/30 transition-colors duration-150 min-h-[44px]"
              >
                {showAgentInfo ? 'Hide agent info' : 'Connect your agent'}
              </button>
            </div>
          </div>
        ) : (
          /* Subscribe form */
          <div className="bg-bg-card border border-border rounded-lg p-5 md:p-6 animate-fade-in">
            <h2 className="text-base font-semibold text-primary mb-2">
              Subscribe to Your Protocol
            </h2>
            <p className="text-xs text-tertiary mb-4">
              Get monthly updates as new research changes your optimal stack. Your protocol adapts automatically.
            </p>

            <div>
              <label className="text-xs font-medium text-tertiary uppercase tracking-wider block mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-bg border border-border rounded-lg text-sm text-primary placeholder-tertiary outline-none focus:border-accent/50 transition-colors duration-150 min-h-[44px]"
                placeholder="you@example.com"
              />
            </div>

            {error && (
              <p className="text-sm text-grade-d mt-4">{error}</p>
            )}

            <div className="flex items-center gap-3 mt-5">
              <button
                onClick={handleSubscribe}
                disabled={submitting}
                className="flex-1 py-3 bg-accent text-bg text-sm font-medium rounded-lg hover:bg-accent-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150 min-h-[44px]"
              >
                {submitting ? 'Subscribing...' : 'Subscribe'}
              </button>
              <button
                onClick={() => setShowSubscribe(false)}
                className="px-4 py-3 text-sm text-secondary hover:text-primary border border-border rounded-lg transition-colors duration-150 min-h-[44px]"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* Connect Your Agent section */}
        {showAgentInfo && (
          <div className="mt-6 bg-bg-card border border-border rounded-lg p-5 md:p-6 animate-fade-in">
            <h2 className="text-base font-semibold text-primary mb-2">
              Connect Your AI Agent
            </h2>
            <p className="text-sm text-secondary mb-4">
              Your AI assistant can manage your protocol automatically.
            </p>

            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-medium text-tertiary uppercase tracking-wider mb-1.5">
                  REST API
                </h3>
                <code className="block text-xs text-accent bg-bg px-3 py-2 rounded border border-border break-all">
                  POST https://longivity-production.up.railway.app/consult-stack
                </code>
              </div>

              <div>
                <h3 className="text-xs font-medium text-tertiary uppercase tracking-wider mb-1.5">
                  MCP
                </h3>
                <p className="text-sm text-secondary">
                  Available for Claude Desktop and compatible clients.
                </p>
              </div>

              <div>
                <h3 className="text-xs font-medium text-tertiary uppercase tracking-wider mb-1.5">
                  Protocol Subscribe
                </h3>
                <code className="block text-xs text-accent bg-bg px-3 py-2 rounded border border-border break-all">
                  POST https://longivity-production.up.railway.app/protocol/subscribe
                </code>
              </div>
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-xs text-tertiary mt-8 leading-relaxed">
          This protocol is generated based on available research data. It is
          not medical advice. Consult a healthcare professional before
          starting any supplement regimen.
        </p>
      </section>
    </div>
  );
}
