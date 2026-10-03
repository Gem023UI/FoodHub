// ── API Base URL ────────────────────────────────────────────────────────
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";

// ── Favorite Types ─────────────────────────────────────────────────────
export interface StudentFavorite {
  stallId: string;
  productId: string;
  productName: string;
  stallName: string;
  date: string;
}

export interface FavoriteWithDetails extends StudentFavorite {
  productDetails?: Product;
  category?: string;
}

export interface TopFavoriteItem {
  productId: string;
  productName: string;
  productDescription?: string;
  productImages?: string[];
  price: number;
  category: string;
  favorite: number;
  favoriteCount?: number;
  nutrition?: ProductNutrition;
  stallId: string;
  stallName: string;
}

export interface DetailedFavorite extends Product {
  orderCount: number;
  favoritedAt: string;
}

import type { Product, ProductNutrition } from './product.service';

// ── Favorite Functions ─────────────────────────────────────────────────
export async function toggleFavorite(token: string, productId: string): Promise<{ isFavorited: boolean; favoriteCount: number }> {
  const response = await fetch(`${apiBaseUrl}/favorites/toggle`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ productId })
  });
  if (!response.ok) throw new Error("Failed to toggle favorite");
  return response.json();
}

export async function checkFavorite(token: string, productId: string): Promise<{ isFavorited: boolean }> {
  const response = await fetch(`${apiBaseUrl}/favorites/check/${productId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to check favorite");
  return response.json();
}

export async function getFavorites(token: string): Promise<StudentFavorite[]> {
  const response = await fetch(`${apiBaseUrl}/favorites`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to fetch favorites");
  const data = await response.json() as { favorites: StudentFavorite[] };
  return data.favorites;
}

export async function getFavoritesByCategory(token: string): Promise<Record<string, FavoriteWithDetails[]>> {
  const response = await fetch(`${apiBaseUrl}/favorites/by-category`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to fetch favorites by category");
  const data = await response.json() as { favorites: Record<string, FavoriteWithDetails[]> };
  return data.favorites;
}

export async function getTopFavoritesByCourse(course: string): Promise<Record<string, TopFavoriteItem[]>> {
  const response = await fetch(`${apiBaseUrl}/favorites/top/course/${encodeURIComponent(course)}`);
  if (!response.ok) throw new Error("Failed to fetch top favorites by course");
  const data = await response.json() as { topFavorites: Record<string, TopFavoriteItem[]> };
  return data.topFavorites;
}

export async function getTopFavoritesByPeriod(period: "today" | "week" | "month" | "all"): Promise<Record<string, TopFavoriteItem[]>> {
  const response = await fetch(`${apiBaseUrl}/favorites/top/period/${period}`);
  if (!response.ok) throw new Error("Failed to fetch top favorites by period");
  const data = await response.json() as { topFavorites: Record<string, TopFavoriteItem[]> };
  return data.topFavorites;
}

export async function getAllStallsWithFavorites(): Promise<any[]> {
  const response = await fetch(`${apiBaseUrl}/favorites/stalls/all`);
  if (!response.ok) throw new Error("Failed to fetch stalls with favorites");
  const data = await response.json() as { stalls: any[] };
  return data.stalls;
}

export async function getDetailedFavorites(token: string): Promise<DetailedFavorite[]> {
  const response = await fetch(`${apiBaseUrl}/favorites/detailed`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to fetch favorites");
  const data = await response.json() as { favorites: DetailedFavorite[] };
  return data.favorites;
}