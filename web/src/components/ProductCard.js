'use client';

import { getGradeColor } from '@/lib/api';

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

export default function ProductCard({ product, onClick, compact = false }) {
  if (compact) {
    return (
      <button
        onClick={() => onClick?.(product)}
        className="w-full text-left p-3 border border-border rounded-lg hover:bg-bg-hover transition-colors duration-150"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-primary truncate">{product.name}</span>
          <GradeDot grade={product.evidenceGrade} />
        </div>
        {product.description && (
          <p className="text-xs text-tertiary mt-1 line-clamp-1">{product.description}</p>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={() => onClick?.(product)}
      className="w-full text-left p-4 bg-bg-card border border-border rounded-lg hover:bg-bg-hover transition-colors duration-150"
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <h3 className="text-sm font-semibold text-primary truncate">{product.name}</h3>
        <GradeDot grade={product.evidenceGrade} />
      </div>
      {product.description && (
        <p className="text-sm text-secondary line-clamp-1">{product.description}</p>
      )}
      {product.dosage && (
        <p className="text-xs text-tertiary mt-2">
          {typeof product.dosage === 'string' ? product.dosage : product.dosage.standard}
        </p>
      )}
    </button>
  );
}
