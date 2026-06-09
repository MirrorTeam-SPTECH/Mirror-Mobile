// Leia API_BASE_URL do .env (EXPO_PUBLIC_API_URL=...).
// Fallback: localhost para emulador/web. Celular físico → defina no .env com o IP da máquina.
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000/api';

// Token armazenado em memória (definido pelo AuthContext após login)
let _authToken = null;
let _onUnauthorized = null;

export function setAuthToken(token) {
  _authToken = token;
}

export function clearAuthToken() {
  _authToken = null;
}

export function setOnUnauthorized(callback) {
  _onUnauthorized = callback;
}

async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (_authToken) {
    headers['Authorization'] = `Bearer ${_authToken}`;
  }

  try {
    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      if (response.status === 401) {
        clearAuthToken();
        _onUnauthorized?.();
      }
      let detail = `${response.status} ${response.statusText}`;
      try {
        const body = await response.json();
        if (body.detail) detail = body.detail;
      } catch (_) {}
      throw new Error(detail);
    }

    return await response.json();
  } catch (error) {
    console.error(`API request failed: ${url}`, error);
    throw error;
  }
}

// ============================================================================
// Auth
// ============================================================================

export async function register(email, name, password, phone) {
  return fetchAPI('/users/register', {
    method: 'POST',
    body: JSON.stringify({ email, name, password, phone }),
  });
}

export async function login(email, password) {
  return fetchAPI('/users/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function getMe() {
  return fetchAPI('/users/me');
}

export async function forgotPassword(email) {
  return fetchAPI('/users/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(code, newPassword) {
  return fetchAPI('/users/reset-password', {
    method: 'POST',
    body: JSON.stringify({ code, new_password: newPassword }),
  });
}

// ============================================================================
// Catalog
// ============================================================================

export async function getCategories() {
  return fetchAPI('/categories');
}

export async function getProducts(filters = {}) {
  const params = new URLSearchParams();
  if (filters.category_id) params.append('category_id', filters.category_id);
  if (filters.is_active !== undefined) params.append('is_active', filters.is_active);
  const qs = params.toString();
  return fetchAPI(qs ? `/products?${qs}` : '/products');
}

export async function getProductById(productId) {
  return fetchAPI(`/products/${productId}`);
}

// ============================================================================
// Orders
// ============================================================================

export async function createOrder(items, notes) {
  return fetchAPI('/orders', {
    method: 'POST',
    body: JSON.stringify({ items, notes }),
  });
}

export async function getOrders() {
  return fetchAPI('/orders');
}

export async function getTopProduct() {
  return fetchAPI('/orders/top-product');
}

export async function getLoyalty() {
  return fetchAPI('/loyalty');
}

export async function getOrderById(orderId) {
  return fetchAPI(`/orders/${orderId}`);
}

export async function createPaymentPreference(orderId) {
  return fetchAPI(`/orders/${orderId}/pay`, { method: 'POST' });
}

// ============================================================================
// Favorites
// ============================================================================

export async function getFavorites() {
  return fetchAPI('/favorites');
}

export async function addFavorite(productId) {
  return fetchAPI(`/favorites/${productId}`, { method: 'POST' });
}

export async function removeFavorite(productId) {
  return fetchAPI(`/favorites/${productId}`, { method: 'DELETE' });
}

// ============================================================================
// Nutrition
// ============================================================================

export async function getProductNutrition(productId) {
  return fetchAPI(`/nutrition/products/${productId}`);
}

export async function getNutritionNarrative(productId, productName, nutrition) {
  return fetchAPI('/nutrition/narrative', {
    method: 'POST',
    body: JSON.stringify({ product_id: productId, product_name: productName, nutrition }),
  });
}

// ============================================================================
// AI Features
// ============================================================================

export async function getNutritionRanking(orderId) {
  return fetchAPI('/nutrition-ranking', {
    method: 'POST',
    body: JSON.stringify({ order_id: orderId }),
  });
}

export async function analyzeGrillImage(imageBase64, mediaType = 'image/jpeg') {
  return fetchAPI('/grill-advisor', {
    method: 'POST',
    body: JSON.stringify({ image_base64: imageBase64, media_type: mediaType }),
  });
}

export async function analyzeLabelScanner(imageBase64, mediaType = 'image/jpeg') {
  return fetchAPI('/label-scanner', {
    method: 'POST',
    body: JSON.stringify({ image_base64: imageBase64, media_type: mediaType }),
  });
}

// ============================================================================
// Ratings
// ============================================================================

export async function getOrderETA(orderId) {
  return fetchAPI(`/orders/${orderId}/eta`);
}

export async function getRating(orderId) {
  return fetchAPI(`/orders/${orderId}/rating`);
}

export async function submitRating(orderId, stars, comment, image_base64) {
  return fetchAPI(`/orders/${orderId}/rating`, {
    method: 'POST',
    body: JSON.stringify({ stars, comment, image_base64 }),
  });
}

// ============================================================================
// Truck
// ============================================================================

export async function getTruckStatus() {
  return fetchAPI('/truck/status');
}

// ============================================================================
// Helpers
// ============================================================================

export function formatPrice(cents) {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}
