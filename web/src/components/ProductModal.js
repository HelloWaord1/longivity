'use client';

import { useEffect } from 'react';
import { getGradeColor, getCategoryEmoji } from '@/lib/api';

export default function ProductModal({ product, onClose }) {
  const grade = getGradeColor(product?.evidenceGrade);

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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto glass-card animate-fade-up">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-bg-hover text-muted hover:text-white hover:bg-bg-elevated transition-all z-10"
        >
          ✕
        </button>

        {/* Header */}
        <div className="p-6 pb-4 border-b border-border/50">
          <div className="flex items-start gap-4">
            <span className="text-4xl">{getCategoryEmoji(product.category)}</span>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-2">{product.name}</h2>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`grade-badge ${grade.class}`}>Grade {product.evidenceGrade}</span>
                <span className="category-badge">{product.category}</span>
                {product.riskProfile && (
                  <span className={`category-badge ${
                    product.riskProfile === 'low' ? 'text-grade-a' :
                    product.riskProfile === 'medium' ? 'text-grade-c' : 'text-grade-d'
                  }`}>
                    {product.riskProfile} risk
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <p className="text-zinc-300 leading-relaxed">{product.description}</p>
          </div>

          {/* Dosage */}
          {product.dosage && (
            <div className="glass-card p-4">
              <h3 className="text-sm font-semibold text-accent mb-2 flex items-center gap-2">
                <span>💊</span> Dosage
              </h3>
              <p className="text-white font-medium">
                {typeof product.dosage === 'string' ? product.dosage : product.dosage.standard}
              </p>
            </div>
          )}

          {/* Mechanisms */}
          {product.mechanisms && product.mechanisms.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <span>⚙️</span> Mechanisms of Action
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {product.mechanisms.map((m, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 bg-bg-hover rounded-xl">
                    <span className="text-accent text-xs">●</span>
                    <span className="text-sm text-zinc-300">{m}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Findings */}
          {product.keyFindings && product.keyFindings.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <span>🔬</span> Key Findings
              </h3>
              <div className="space-y-2">
                {product.keyFindings.map((f, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                    <span className="text-accent mt-1 shrink-0">→</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs text-muted bg-bg-hover px-3 py-1 rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div className="px-6 pb-6">
          <p className="text-xs text-muted/60 border-t border-border/30 pt-4">
            ⚠️ This information is for educational purposes only. Consult a healthcare 
            professional before starting any supplement regimen.
          </p>
        </div>
      </div>
    </div>
  );
}
