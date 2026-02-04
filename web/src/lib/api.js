const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://longivity-production.up.railway.app';

export async function fetchProducts() {
  const res = await fetch(`${API_URL}/products`);
  if (!res.ok) throw new Error('Failed to fetch products');
  const data = await res.json();
  return data.products || [];
}

export async function fetchProduct(name) {
  const res = await fetch(`${API_URL}/products/${encodeURIComponent(name)}`);
  if (!res.ok) throw new Error('Failed to fetch product');
  return res.json();
}

export async function fetchResearch() {
  const res = await fetch(`${API_URL}/research`);
  if (!res.ok) throw new Error('Failed to fetch research');
  const data = await res.json();
  return data.papers || [];
}

export async function fetchDigest() {
  const res = await fetch(`${API_URL}/digest`);
  if (!res.ok) throw new Error('Failed to fetch digest');
  const data = await res.json();
  return data.digest || '';
}

export async function consultAI(query) {
  const res = await fetch(`${API_URL}/consult`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error('Failed to consult');
  return res.json();
}

export async function getRecommendation({ budget, age, goals }) {
  const res = await fetch(`${API_URL}/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ budget, age, goals }),
  });
  if (!res.ok) throw new Error('Failed to get recommendation');
  return res.json();
}

export function getGradeColor(grade) {
  const g = (grade || 'D').toUpperCase();
  switch (g) {
    case 'A': return { bg: 'bg-grade-a/15', text: 'text-grade-a', class: 'grade-a' };
    case 'B': return { bg: 'bg-accent-dim', text: 'text-accent', class: 'grade-b' };
    case 'C': return { bg: 'bg-grade-c/15', text: 'text-grade-c', class: 'grade-c' };
    case 'D': return { bg: 'bg-grade-d/15', text: 'text-grade-d', class: 'grade-d' };
    default: return { bg: 'bg-white/10', text: 'text-muted', class: 'grade-d' };
  }
}

export function getCategoryEmoji(category) {
  const map = {
    supplement: '💊',
    protocol: '🏋️',
    pharmaceutical: '💉',
    peptide: '🧬',
    research: '🔬',
    news: '📰',
  };
  return map[category?.toLowerCase()] || '📋';
}

export function getCategoryGradient(category) {
  const map = {
    supplement: 'from-cyan-600/20 to-blue-600/20',
    protocol: 'from-green-600/20 to-emerald-600/20',
    pharmaceutical: 'from-purple-600/20 to-violet-600/20',
    peptide: 'from-pink-600/20 to-rose-600/20',
    supplements: 'from-cyan-600/20 to-blue-600/20',
    research: 'from-amber-600/20 to-orange-600/20',
    protocols: 'from-green-600/20 to-emerald-600/20',
    news: 'from-indigo-600/20 to-blue-600/20',
  };
  return map[category?.toLowerCase()] || 'from-zinc-600/20 to-zinc-700/20';
}
