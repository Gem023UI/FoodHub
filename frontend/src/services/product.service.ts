// ── API Base URL ────────────────────────────────────────────────────────
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";

// ── Product Types ──────────────────────────────────────────────────────
export type ProductCategory = "Rice Meal" | "Beverage" | "Snacks" | "Add-ons";

export interface ProductNutrition {
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  allergen: string;
}

export interface ProductReview {
  _id: string;
  reviewEmail: string;
  reviewProfileUrl: string | null;
  rating: number;
  comment: string;
  reviewImages: string[];
  reviewDate: string;
}

export interface Product {
  _id: string;
  productName: string;
  productDescription: string;
  productImages: string[];
  category: ProductCategory;
  price: number;
  nutrition: ProductNutrition;
  favorite: number;
  stocks: number;
  available: boolean;
  reviews: ProductReview[];
  averageRating: number;
  reviewCount: number;
  stallId?: {
    _id: string;
    stallName: string;
    stallPicture: string | null;
  } | string;
  stallName?: string;
}

// ── Product Functions ──────────────────────────────────────────────────
export async function getProductCard(productId: string): Promise<Product> {
  const response = await fetch(`${apiBaseUrl}/products/card/${productId}`);
  if (!response.ok) throw new Error("Failed to fetch product");
  const data = await response.json() as { product: Product };
  return data.product;
}

export async function getProductDetails(productId: string): Promise<Product> {
  const response = await fetch(`${apiBaseUrl}/products/details/${productId}`);
  if (!response.ok) throw new Error("Failed to fetch product");
  const data = await response.json() as { product: Product };
  return data.product;
}

export async function getProductsByStall(stallId: string, filters?: { category?: string; available?: boolean }): Promise<Product[]> {
  if (!stallId) return [];
  const params = new URLSearchParams();
  if (filters?.category) params.append("category", filters.category);
  if (filters?.available !== undefined) params.append("available", String(filters.available));
  
  const url = `${apiBaseUrl}/products/stall/${stallId}${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url);
  if (!response.ok) {
    console.error(`Failed to fetch products for stall ${stallId}:`, response.status);
    return [];
  }
  const data = await response.json() as { products: Product[] };
  return data.products || [];
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  const response = await fetch(`${apiBaseUrl}/products/category/${encodeURIComponent(category)}`);
  if (!response.ok) throw new Error("Failed to fetch products by category");
  const data = await response.json() as { products: Product[] };
  return data.products;
}

export async function createProduct(token: string, stallId: string, productData: Partial<Product>): Promise<{ product: Product }> {
  const response = await fetch(`${apiBaseUrl}/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ stallId, ...productData })
  });
  if (!response.ok) {
    const data = await response.json() as { message?: string };
    throw new Error(data.message ?? "Failed to create product");
  }
  return response.json();
}

export async function updateProduct(token: string, productId: string, updates: Partial<Product>): Promise<{ product: Product }> {
  const response = await fetch(`${apiBaseUrl}/products/${productId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(updates)
  });
  if (!response.ok) {
    const data = await response.json() as { message?: string };
    throw new Error(data.message ?? "Failed to update product");
  }
  return response.json();
}

export async function deleteProduct(token: string, productId: string): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/products/${productId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) {
    const data = await response.json() as { message?: string };
    throw new Error(data.message ?? "Failed to delete product");
  }
}