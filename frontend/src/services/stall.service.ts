// ── API Base URL ────────────────────────────────────────────────────────
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";

// ── Stall Types ────────────────────────────────────────────────────────
export interface StallVendor {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  vendorImage: string | null;
  role: "student" | "admin" | "vendor";
  position: "Cook" | "Manager" | "Financier";
  status: "unverified" | "verified" | "deactivated";
}

export interface StallPaymentMethodEntry {
  phoneNumber?: string;
  accountName?: string;
  available: boolean;
}

export interface Stall {
  _id: string;
  stallName: string;
  stallDescription: string;
  stallPicture: string | null;
  section: number;
  openHours: {
    openTime: string;
    closingTime: string;
  };
  status: boolean;
  proofOfContract: string | null;
  paymentMethod: {
    cash: { available: boolean };
    gcash: StallPaymentMethodEntry;
    paymaya: StallPaymentMethodEntry;
  };
  products?: Product[];
  vendors?: StallVendor[];
  isInOperation?: boolean;
  message?: string;
}

import type { Product } from '../pages/Product';

// ── Stall Functions ────────────────────────────────────────────────────
export async function getStalls(): Promise<Stall[]> {
  const response = await fetch(`${apiBaseUrl}/stalls`);
  if (!response.ok) throw new Error("Failed to fetch stalls");
  const data = await response.json() as { stalls: Stall[] };
  return data.stalls;
}

export async function getAvailableStalls(): Promise<Array<{_id: string, name: string, location: string}>> {
  const stalls = await getStalls();
  return stalls.map((s) => ({ _id: s._id, name: s.stallName, location: `Section ${s.section}` }));
}

export async function getStallCard(stallId: string): Promise<{ stallName: string; stallPicture: string | null; section: number; status: boolean }> {
  const response = await fetch(`${apiBaseUrl}/stalls/card/${stallId}`);
  if (!response.ok) throw new Error("Failed to fetch stall");
  const data = await response.json() as { stall: any };
  return data.stall;
}

export async function getStallDetails(stallId: string): Promise<Stall> {
  const response = await fetch(`${apiBaseUrl}/stalls/details/${stallId}`);
  if (!response.ok) throw new Error("Failed to fetch stall");
  const data = await response.json() as { stall: Stall };
  return data.stall;
}

export async function getVendorStall(token: string): Promise<Stall> {
  const response = await fetch(`${apiBaseUrl}/stalls/vendor/my`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to fetch vendor stall");
  const data = await response.json() as { stall: Stall };
  return data.stall;
}

export async function getStallProductsByCategory(stallId: string, category: string): Promise<Product[]> {
  const response = await fetch(`${apiBaseUrl}/stalls/${stallId}/products/category/${encodeURIComponent(category)}`);
  if (!response.ok) throw new Error("Failed to fetch products by category");
  const data = await response.json() as { products: Product[] };
  return data.products;
}

export async function getStallProductReviews(stallId: string): Promise<any[]> {
  const response = await fetch(`${apiBaseUrl}/stalls/${stallId}/products/reviews`);
  if (!response.ok) throw new Error("Failed to fetch reviews");
  const data = await response.json() as { reviews: any[] };
  return data.reviews;
}

export async function getStallVendors(stallId: string): Promise<StallVendor[]> {
  const response = await fetch(`${apiBaseUrl}/stalls/${stallId}/vendors`);
  if (!response.ok) throw new Error("Failed to fetch vendors");
  const data = await response.json() as { vendors: StallVendor[] };
  return data.vendors;
}

export async function getVendorProfile(token: string): Promise<any> {
  const response = await fetch(`${apiBaseUrl}/stalls/vendor/profile`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to fetch vendor profile");
  const data = await response.json() as { vendor: any };
  return data.vendor;
}

export async function getStallOrders(token: string, stallId: string): Promise<any[]> {
  const response = await fetch(`${apiBaseUrl}/orders/stall/${stallId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to fetch stall orders");
  const data = await response.json() as { orders: any[] };
  return data.orders;
}

export async function createStall(token: string, stallData: Partial<Stall>): Promise<{ stall: Stall }> {
  const response = await fetch(`${apiBaseUrl}/stalls`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(stallData)
  });
  if (!response.ok) {
    const data = await response.json() as { message?: string };
    throw new Error(data.message ?? "Failed to create stall");
  }
  return response.json();
}

export async function updateStall(token: string, stallId: string, updates: Partial<Stall>): Promise<{ stall: Stall }> {
  const response = await fetch(`${apiBaseUrl}/stalls/${stallId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(updates)
  });
  if (!response.ok) {
    const data = await response.json() as { message?: string };
    throw new Error(data.message ?? "Failed to update stall");
  }
  return response.json();
}

export async function deleteStall(token: string, stallId: string): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/stalls/${stallId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) {
    const data = await response.json() as { message?: string };
    throw new Error(data.message ?? "Failed to delete stall");
  }
}

export async function setStallStatus(token: string, stallId: string, status: boolean): Promise<{ stall: Stall }> {
  const response = await fetch(`${apiBaseUrl}/stalls/${stallId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ status })
  });
  if (!response.ok) {
    const data = await response.json() as { message?: string };
    throw new Error(data.message ?? "Failed to update stall status");
  }
  return response.json();
}

export interface AddVendorAccountInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  contactNumber?: string;
  position: "Cook" | "Manager" | "Financier";
}

export async function addVendorAccount(token: string, stallId: string, input: AddVendorAccountInput): Promise<{ vendor: any }> {
  const response = await fetch(`${apiBaseUrl}/stalls/${stallId}/vendor-account`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(input)
  });
  if (!response.ok) {
    const data = await response.json() as { message?: string };
    throw new Error(data.message ?? "Failed to add vendor");
  }
  return response.json();
}