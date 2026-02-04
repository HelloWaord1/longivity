'use client';

import { useEffect } from 'react';
import { useProtocol } from '@/lib/ProtocolContext';

function GradeDot({ grade }) {
  const colors = { A: 'bg-grade-a', B: 'bg-grade-b', C: 'bg-grade-c', D: 'bg-grade-d' };
  const g = (grade || 'D').toUpperCase();
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-secondary">
      <span className={`w-2 h-2 rounded-full ${colors[g] || colors.D}`} />
      Grade {g}
    </span>
  );
}

export default function ProductModal({ product, onClose }) {
  const { addToProtocol, isInProtocol } = useProtocol();

  useEffect(() => {
    const handleEsc = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!product) return null;

  const slug =
    product.slug ||
    product.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

  const inProtocol = isInProtocol(slug);

  const handleAdd = () => {
    addToProtocol({
      name: product.name,
      slug,
      dosage:
        typeof product.dosage === 'string'
          ? product.dosage
          : product.dosage?.standard || null,
      monthlyCost: product.monthlyCost || null,
      evidenceGrade: product.evidenceGrade,
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-bg-card border border-border rounded-t-xl md:rounded-xl animate-fade-in">
        {/* Header */}
        <div className="sticky top-0 bg-bg-card border-b border-border px-5 py-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-primary">{product.name}</h2>
            <div className="flex items-center gap-3 mt-1">
              <GradeDot grade={product.evidenceGrade} />
              {product.category && (
                <span className="text-xs text-tertiary uppercase tracking-wider font-medium">{product.category}</span>
              )}
              {product.riskProfile && (
                <span className="text-xs text-tertiary">{product.riskProfile} risk</span>
              )}
            </div>
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
          {/* Description */}
          {product.description && (
            <p className="text-sm text-secondary leading-relaxed">{product.description}</p>
          )}

          {/* Add to protocol */}
          <button
            onClick={handleAdd}
            disabled={inProtocol}
            className={`w-full py-3 text-sm font-medium rounded-lg transition-colors duration-150 min-h-[44px] ${
              inProtocol
                ? 'bg-bg-hover text-tertiary cursor-default'
                : 'bg-accent text-bg hover:bg-accent-hover'
            }`}
          >
            {inProtocol ? 'Added to protocol' : 'Add to protocol'}
          </button>

          {/* Dosage */}
          {product.dosage && (
            <div className="border-t border-border pt-4">
              <h3 className="text-xs font-medium text-tertiary uppercase tracking-wider mb-2">Dosage</h3>
              <p className="text-sm text-primary">
                {typeof product.dosage === 'string' ? product.dosage : product.dosage.standard}
              </p>
            </div>
          )}

          {/* Mechanisms */}
          {product.mechanisms && product.mechanisms.length > 0 && (
            <div className="border-t border-border pt-4">
              <h3 className="text-xs font-medium text-tertiary uppercase tracking-wider mb-2">Mechanisms</h3>
              <ul className="space-y-1">
                {product.mechanisms.map((m, i) => (
                  <li key={i} className="text-sm text-secondary">{m}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Key Findings */}
          {product.keyFindings && product.keyFindings.length > 0 && (
            <div className="border-t border-border pt-4">
              <h3 className="text-xs font-medium text-tertiary uppercase tracking-wider mb-2">Key Findings</h3>
              <ul className="space-y-2">
                {product.keyFindings.map((f, i) => (
                  <li key={i} className="text-sm text-secondary leading-relaxed">{f}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="border-t border-border pt-4">
              <div className="flex flex-wrap gap-1.5">
                {product.tags.map((tag) => (
                  <span key={tag} className="text-xs text-tertiary bg-bg-hover px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div className="px-5 py-4 border-t border-border">
          <p className="text-xs text-tertiary leading-relaxed">
            This information is for educational purposes only. Consult a healthcare professional before starting any supplement regimen.
          </p>
        </div>
      </div>
    </div>
  );
}
