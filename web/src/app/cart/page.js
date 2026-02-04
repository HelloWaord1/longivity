'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/lib/CartContext';
import { placeOrder } from '@/lib/api';

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

export default function CartPage() {
  const { items, total, removeFromCart, clearCart, mounted } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    street: '',
    city: '',
    country: '',
    zip: '',
  });

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePlaceOrder = async () => {
    if (!form.name || !form.email) {
      setError('Name and email are required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await placeOrder({
        customer: {
          name: form.name,
          email: form.email,
          address: {
            street: form.street,
            city: form.city,
            country: form.country,
            zip: form.zip,
          },
        },
        items: items.map((item) => ({
          name: item.name,
          slug: item.slug,
          dosage: item.dosage,
          monthlyCost: item.monthlyCost,
          evidenceGrade: item.evidenceGrade,
        })),
        total,
      });

      setOrderPlaced(true);
      clearCart();
    } catch (err) {
      setError('Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) {
    return (
      <div className="animate-fade-in">
        <section className="max-w-3xl mx-auto px-4 md:px-6 pt-10 pb-16">
          <h1 className="text-2xl font-semibold text-primary mb-1">Cart</h1>
          <p className="text-sm text-secondary">Loading...</p>
        </section>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="animate-fade-in">
        <section className="max-w-3xl mx-auto px-4 md:px-6 pt-10 pb-16">
          <h1 className="text-2xl font-semibold text-primary mb-4">
            Order Confirmed
          </h1>
          <div className="bg-bg-card border border-border rounded-lg p-6">
            <p className="text-sm text-secondary leading-relaxed mb-4">
              Your order has been received. We will be in touch at the email
              address you provided.
            </p>
            <Link
              href="/products"
              className="text-sm text-accent hover:text-accent-hover transition-colors duration-150"
            >
              Continue browsing
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <section className="max-w-3xl mx-auto px-4 md:px-6 pt-10 pb-16">
        <h1 className="text-2xl font-semibold text-primary mb-1">Cart</h1>
        <p className="text-sm text-secondary mb-6">
          Your personalized supplement stack.
        </p>

        {items.length === 0 ? (
          <div className="bg-bg-card border border-border rounded-lg p-6 text-center">
            <p className="text-sm text-secondary mb-4">Your cart is empty.</p>
            <div className="flex items-center justify-center gap-4">
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
                Build a stack
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Cart items */}
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
                  </div>
                  <button
                    onClick={() => removeFromCart(item.slug)}
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
            {!showCheckout ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowCheckout(true)}
                  className="flex-1 py-3 bg-accent text-bg text-sm font-medium rounded-lg hover:bg-accent-hover transition-colors duration-150 min-h-[44px]"
                >
                  Checkout
                </button>
                <button
                  onClick={clearCart}
                  className="px-4 py-3 text-sm text-secondary hover:text-primary border border-border rounded-lg transition-colors duration-150 min-h-[44px]"
                >
                  Clear
                </button>
              </div>
            ) : (
              /* Checkout form */
              <div className="bg-bg-card border border-border rounded-lg p-5 md:p-6 animate-fade-in">
                <h2 className="text-base font-semibold text-primary mb-4">
                  Shipping Details
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-tertiary uppercase tracking-wider block mb-1.5">
                      Name
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      className="w-full px-4 py-3 bg-bg border border-border rounded-lg text-sm text-primary placeholder-tertiary outline-none focus:border-accent/50 transition-colors duration-150 min-h-[44px]"
                      placeholder="Full name"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-tertiary uppercase tracking-wider block mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => handleFormChange('email', e.target.value)}
                      className="w-full px-4 py-3 bg-bg border border-border rounded-lg text-sm text-primary placeholder-tertiary outline-none focus:border-accent/50 transition-colors duration-150 min-h-[44px]"
                      placeholder="you@example.com"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-tertiary uppercase tracking-wider block mb-1.5">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={form.street}
                      onChange={(e) =>
                        handleFormChange('street', e.target.value)
                      }
                      className="w-full px-4 py-3 bg-bg border border-border rounded-lg text-sm text-primary placeholder-tertiary outline-none focus:border-accent/50 transition-colors duration-150 min-h-[44px]"
                      placeholder="123 Main St"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-tertiary uppercase tracking-wider block mb-1.5">
                        City
                      </label>
                      <input
                        type="text"
                        value={form.city}
                        onChange={(e) =>
                          handleFormChange('city', e.target.value)
                        }
                        className="w-full px-4 py-3 bg-bg border border-border rounded-lg text-sm text-primary placeholder-tertiary outline-none focus:border-accent/50 transition-colors duration-150 min-h-[44px]"
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-tertiary uppercase tracking-wider block mb-1.5">
                        ZIP / Postal Code
                      </label>
                      <input
                        type="text"
                        value={form.zip}
                        onChange={(e) =>
                          handleFormChange('zip', e.target.value)
                        }
                        className="w-full px-4 py-3 bg-bg border border-border rounded-lg text-sm text-primary placeholder-tertiary outline-none focus:border-accent/50 transition-colors duration-150 min-h-[44px]"
                        placeholder="12345"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-tertiary uppercase tracking-wider block mb-1.5">
                      Country
                    </label>
                    <input
                      type="text"
                      value={form.country}
                      onChange={(e) =>
                        handleFormChange('country', e.target.value)
                      }
                      className="w-full px-4 py-3 bg-bg border border-border rounded-lg text-sm text-primary placeholder-tertiary outline-none focus:border-accent/50 transition-colors duration-150 min-h-[44px]"
                      placeholder="Country"
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-grade-d mt-4">{error}</p>
                )}

                <div className="flex items-center gap-3 mt-6">
                  <button
                    onClick={handlePlaceOrder}
                    disabled={submitting}
                    className="flex-1 py-3 bg-accent text-bg text-sm font-medium rounded-lg hover:bg-accent-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150 min-h-[44px]"
                  >
                    {submitting ? 'Placing order...' : 'Place Order'}
                  </button>
                  <button
                    onClick={() => setShowCheckout(false)}
                    className="px-4 py-3 text-sm text-secondary hover:text-primary border border-border rounded-lg transition-colors duration-150 min-h-[44px]"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
