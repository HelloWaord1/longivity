const CART_KEY = 'longivity-cart';

function isBrowser() {
  return typeof window !== 'undefined';
}

export function getCart() {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToCart(product) {
  if (!isBrowser()) return [];
  const cart = getCart();
  const existing = cart.find((item) => item.slug === product.slug);
  if (existing) return cart;
  const item = {
    name: product.name,
    slug: product.slug,
    dosage: product.dosage || null,
    monthlyCost: product.monthlyCost || null,
    evidenceGrade: product.evidenceGrade || 'D',
  };
  const updated = [...cart, item];
  localStorage.setItem(CART_KEY, JSON.stringify(updated));
  return updated;
}

export function removeFromCart(slug) {
  if (!isBrowser()) return [];
  const cart = getCart();
  const updated = cart.filter((item) => item.slug !== slug);
  localStorage.setItem(CART_KEY, JSON.stringify(updated));
  return updated;
}

export function clearCart() {
  if (!isBrowser()) return [];
  localStorage.setItem(CART_KEY, JSON.stringify([]));
  return [];
}

export function getCartTotal() {
  const cart = getCart();
  return cart.reduce((sum, item) => sum + (item.monthlyCost || 0), 0);
}

export function getCartCount() {
  return getCart().length;
}

export function isInCart(slug) {
  return getCart().some((item) => item.slug === slug);
}
