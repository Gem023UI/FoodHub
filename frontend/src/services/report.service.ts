// ── API Base URL ────────────────────────────────────────────────────────
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";

// ── Report Types ──────────────────────────────────────────────────────
export interface DashboardInsights {
  summary: {
    totalStudents: number;
    totalStalls: number;
    totalVendors: number;
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    totalBudgets: number;
    totalBudgetAmount: number;
  };
  students: {
    verified: number;
    unverified: number;
    deactivated: number;
    byCourse: Record<string, number>;
  };
  stalls: {
    active: number;
    closed: number;
    withContract: number;
    bySection: Record<string, number>;
  };
  products: {
    total: number;
    available: number;
    byCategory: Record<string, number>;
    topProducts: Array<{
      productId: string;
      productName: string;
      stallName: string;
      price: number;
      favorite: number;
      category: string;
    }>;
  };
  vendors: {
    total: number;
    byStatus: Record<string, number>;
    byPosition: Record<string, number>;
  };
  orders: {
    total: number;
    byStatus: Record<string, number>;
    byPaymentMethod: Record<string, number>;
    revenue: {
      today: number;
      week: number;
      month: number;
      total: number;
    };
  };
  budgets: {
    total: number;
    byStatus: Record<string, number>;
    totalAmount: number;
    activeAmount: number;
  };
  timestamp: string;
}

export interface StudentMe {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  birthday: string | null;
  tuptId: string;
  course: string;
  section: string;
  contactNumber: string | null;
  profilePictureUrl: string | null;
  status: "unverified" | "verified" | "deactivated";
  budgetCap: {
    amount: number | null;
    period: "daily" | "weekly" | "monthly";
  };
}

// ── Report Functions ──────────────────────────────────────────────────
export async function getDashboardInsights(token: string): Promise<DashboardInsights> {
  const response = await fetch(`${apiBaseUrl}/reports/dashboard`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to fetch dashboard insights");
  return response.json();
}

export async function getStallInsights(token: string, stallId: string): Promise<any> {
  const response = await fetch(`${apiBaseUrl}/reports/stall/${stallId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to fetch stall insights");
  return response.json();
}

export async function getProductInsights(token: string): Promise<any> {
  const response = await fetch(`${apiBaseUrl}/reports/products`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to fetch product insights");
  return response.json();
}

export async function getVendorInsights(token: string): Promise<any> {
  const response = await fetch(`${apiBaseUrl}/reports/vendors`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to fetch vendor insights");
  return response.json();
}

export async function getStudentInsights(token: string): Promise<any> {
  const response = await fetch(`${apiBaseUrl}/reports/students`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to fetch student insights");
  return response.json();
}

export async function getOrderInsights(token: string): Promise<any> {
  const response = await fetch(`${apiBaseUrl}/reports/orders`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to fetch order insights");
  return response.json();
}

export async function getBudgetInsights(token: string): Promise<any> {
  const response = await fetch(`${apiBaseUrl}/reports/budgets`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to fetch budget insights");
  return response.json();
}

export async function getTrendInsights(token: string): Promise<any> {
  const response = await fetch(`${apiBaseUrl}/reports/trends`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to fetch trend insights");
  return response.json();
}