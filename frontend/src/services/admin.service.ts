const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> ?? {})
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${apiBaseUrl}${path}`, { ...options, headers });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }
  if (response.status === 204) return {} as T;
  return response.json() as Promise<T>;
}

// ── Stalls ────────────────────────────────────────────────────────────
export interface AdminStallVendor {
  _id: string;
  vendorAuthId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  image: string | null;
  roles: string[];
  status: "unverified" | "pending" | "approved" | "deactivated" | "terminated";
}

export interface AdminStallItem {
  _id: string;
  name: string;
  description: string;
  picture: string | null;
  section: number;
  openHours: {
    openTime: string;
    closingTime: string;
  };
  status: boolean; // open/closed
  proofOfContract: string | null;
  paymentMethod: {
    cash: { available: boolean };
    gcash: { phoneNumber?: string; accountName?: string; available: boolean };
    paymaya: { phoneNumber?: string; accountName?: string; available: boolean };
  };
  vendors?: AdminStallVendor[];
}

export interface AdminMenuItem {
  _id: string;
  stallId: {
    _id: string;
    name: string;
  } | string;
  name: string;
  description: string;
  images: string[];
  category: "Rice Meal" | "Beverage" | "Snacks" | "Add-ons";
  price: number;
  nutrition: {
    calorie: number | null;
    protein: number | null;
    carbs: number | null;
    allergen: string;
  };
  stocks: number;
  isAvailable: boolean;
  favoriteCount?: number;
}

export interface AdminCategoryItem {
  _id: string;
  name: string;
  description: string;
}

export async function fetchAdminStalls(token: string): Promise<AdminStallItem[]> {
  const result = await request<{ stalls: AdminStallItem[] }>("/stalls", {}, token);
  return result.stalls;
}

export async function fetchVendorStalls(token: string): Promise<AdminStallItem[]> {
  const result = await request<{ stalls: AdminStallItem[] }>("/stalls/vendor/my", {}, token);
  return result.stalls;
}

export async function createAdminStall(token: string, input: Partial<AdminStallItem>) {
  return request<{ stall: AdminStallItem }>("/stalls", {
    method: "POST",
    body: JSON.stringify(input)
  }, token);
}

export async function updateAdminStall(token: string, stallId: string, input: Partial<AdminStallItem>) {
  return request<{ stall: AdminStallItem }>(`/stalls/${stallId}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  }, token);
}

export async function deleteAdminStall(token: string, stallId: string) {
  return request<void>(`/stalls/${stallId}`, { method: "DELETE" }, token);
}

// Vendor roster (approve/deactivate a vendor within a stall)
export async function updateStallVendor(token: string, stallId: string, vendorAuthId: string, input: Partial<AdminStallVendor>) {
  return request<{ vendor: AdminStallVendor }>(`/stalls/${stallId}/vendors/${vendorAuthId}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  }, token);
}

export async function removeStallVendor(token: string, stallId: string, vendorAuthId: string) {
  return request<void>(`/stalls/${stallId}/vendors/${vendorAuthId}`, { method: "DELETE" }, token);
}

export async function fetchAdminCategories(token: string): Promise<AdminCategoryItem[]> {
  const result = await request<{ categories: AdminCategoryItem[] }>("/categories", {}, token);
  return result.categories;
}

export async function createAdminCategory(token: string, input: Partial<AdminCategoryItem>) {
  return request<{ category: AdminCategoryItem }>("/categories", {
    method: "POST",
    body: JSON.stringify(input)
  }, token);
}

export async function updateAdminCategory(token: string, categoryId: string, input: Partial<AdminCategoryItem>) {
  return request<{ category: AdminCategoryItem }>(`/categories/${categoryId}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  }, token);
}

export async function deleteAdminCategory(token: string, categoryId: string) {
  return request<void>(`/categories/${categoryId}`, { method: "DELETE" }, token);
}

// ── Products (menu items) ───────────────────────────────────────────────
export async function fetchAdminStallMenuItems(token: string, stallId: string) {
  const result = await request<{ menuItems: AdminMenuItem[] }>(`/stalls/${stallId}/menu-items`, {}, token);
  return result.menuItems;
}

export async function createAdminMenuItem(token: string, stallId: string, input: Partial<AdminMenuItem>) {
  return request<{ menuItem: AdminMenuItem }>(`/stalls/${stallId}/menu-items`, {
    method: "POST",
    body: JSON.stringify(input)
  }, token);
}

export async function updateAdminMenuItem(token: string, menuItemId: string, input: Partial<AdminMenuItem>) {
  return request<{ menuItem: AdminMenuItem }>(`/stalls/menu-items/${menuItemId}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  }, token);
}

export async function deleteAdminMenuItem(token: string, menuItemId: string) {
  return request<void>(`/stalls/menu-items/${menuItemId}`, { method: "DELETE" }, token);
}

export async function fetchAdminMenuItemsAll(token: string): Promise<AdminMenuItem[]> {
  const result = await request<{ menuItems: AdminMenuItem[] }>("/stalls/menu-items/all", {}, token);
  return result.menuItems;
}

// ── Users (students/vendors/admins — unchanged shape) ─────────────────
export interface AdminUserItem {
  _id: string;
  name: string;
  email: string;
  role: "user" | "vendor" | "admin";
  isActive: boolean;
  password?: string;
  status?: "Active" | "Suspended" | "Pending";
}

export async function fetchAdminUsers(token: string): Promise<AdminUserItem[]> {
  const result = await request<{ users: AdminUserItem[] }>("/users", {}, token);
  return result.users;
}

export async function createAdminUser(token: string, input: Partial<AdminUserItem>) {
  return request<{ user: AdminUserItem }>("/users", {
    method: "POST",
    body: JSON.stringify(input)
  }, token);
}

export async function updateAdminUser(token: string, userId: string, input: Partial<AdminUserItem>) {
  return request<{ user: AdminUserItem }>(`/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  }, token);
}

export async function deleteAdminUser(token: string, userId: string) {
  return request<void>(`/users/${userId}`, { method: "DELETE" }, token);
}

// ── Analytics ────────────────────────────────────────────────────────
export interface AdminAnalyticsStallItem {
  _id: string;
  name: string;
  description: string;
  favoriteCount?: number;
  reviewCount?: number;
  averageRating?: number;
}

export async function fetchTopRatedStalls(token: string): Promise<AdminAnalyticsStallItem[]> {
  return request<AdminAnalyticsStallItem[]>("/analytics/top-rated-stalls", {}, token);
}

export async function fetchMostFavoritedStalls(token: string): Promise<AdminAnalyticsStallItem[]> {
  return request<AdminAnalyticsStallItem[]>("/analytics/most-favorited-stalls", {}, token);
}

export interface AINutritionResult {
  description: string;
  ingredients: string[];
  allergens: string[];
  nutrition: {
    calorie: number;
    protein: number;
    carbs: number;
    allergen: string;
  };
}

export async function generateNutritionInfo(
  token: string,
  name: string,
  category?: string,
  description?: string
): Promise<AINutritionResult> {
  return request<AINutritionResult>("/ai/generate-nutrition", {
    method: "POST",
    body: JSON.stringify({ name, category, description })
  }, token);
}