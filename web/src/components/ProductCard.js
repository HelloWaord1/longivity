'use client';

import { getGradeColor, getCategoryEmoji, getCategoryGradient } from '@/lib/api';

export default function ProductCard({ product, onClick, compact = false }) {
  const grade = getGradeColor(product.evidenceGrade);
  const emoji = getCategoryEmoji(product.category);
  const gradient = getCategoryGradient(product.category);

  if (compact) {
    return (
      <div
        onClick={() => onClick?.(product)}
        className="glass-card-hover p-4 cursor-pointer group"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-white group-hover:text-accent transition-colors truncate">
              {product.name}
            </h3>
            <p className="text-xs text-muted mt-1 line-clamp-2">{product.description}</p>
          </div>
          <span className={`grade-badge ${grade.class} shrink-0`}>
            {product.evidenceGrade}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onClick?.(product)}
      className="glass-card-hover overflow-hidden cursor-pointer group"
    >
      {/* Gradient header */}
      <div className={`h-24 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
        <span className="text-4xl opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300">
          {emoji}
        </span>
      </div>

      <div className="p-5">
        {/* Badges */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`grade-badge ${grade.class}`}>
            Grade {product.evidenceGrade}
          </span>
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

        {/* Name + Description */}
        <h3 className="font-semibold text-white group-hover:text-accent transition-colors mb-2">
          {product.name}
        </h3>
        <p className="text-sm text-muted line-clamp-2 mb-3">
          {product.description}
        </p>

        {/* Dosage */}
        {product.dosage && (
          <div className="text-xs text-accent/80 flex items-center gap-1.5">
            <span>💊</span>
            <span>{typeof product.dosage === 'string' ? product.dosage : product.dosage.standard}</span>
          </div>
        )}

        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {product.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="text-[10px] text-muted/70 bg-bg-hover px-2 py-0.5 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
