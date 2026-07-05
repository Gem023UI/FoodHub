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

export interface NutritionAnalytics {
  labels: string[];
  protein: number[];
  carbs: number[];
  calories: number[];
  averages: {
    protein: number;
    carbs: number;
    calories: number;
  };
}

export interface SpendingAnalytics {
  daily: number;
  weekly: number;
  monthly: number;
  remaining: number;
  totalSpent: number;
  periodData: Array<{
    label: string;
    value: number;
  }>;
}

export interface StudentRegistrationTrend {
  labels: string[];
  values: number[];
}

export interface StallDetails {
  _id: string;
  stallName: string;
  stallPicture: string | null;
  section: number;
  status: boolean;
  totalRevenue: number;
  totalOrders: number;
  productCount: number;
  vendorCount: number;
}

export interface OrderTrend {
  labels: string[];
  values: number[];
}

// ── Report Functions ──────────────────────────────────────────────────
export async function getDashboardInsights(token: string): Promise<DashboardInsights> {
  const response = await fetch(`${apiBaseUrl}/reports/dashboard`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to fetch dashboard insights");
  return response.json();
}

// ── STUDENT ANALYTICS ──────────────────────────────────────────────────
export async function getStudentRegistrationTrend(
  token: string,
  period: 'weekly' | 'monthly' | 'custom' = 'weekly',
  startDate?: string,
  endDate?: string
): Promise<StudentRegistrationTrend> {
  const params = new URLSearchParams();
  params.append('period', period);
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  const response = await fetch(`${apiBaseUrl}/reports/students/registration?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to fetch student registration trend");
  return response.json();
}

export async function getStudentCourseDistribution(token: string): Promise<Record<string, number>> {
  const response = await fetch(`${apiBaseUrl}/reports/students/course-distribution`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to fetch student course distribution");
  return response.json();
}

export async function getStudentVerifiedComparison(token: string): Promise<{
  total: number;
  verified: number;
  unverified: number;
  deactivated: number;
  verifiedPercentage: number;
}> {
  const response = await fetch(`${apiBaseUrl}/reports/students/verified-comparison`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to fetch student verified comparison");
  return response.json();
}

// ── STALL ANALYTICS ────────────────────────────────────────────────────
export async function getStallSectionStatus(token: string): Promise<{
  totalSections: number;
  occupiedSections: number;
  emptySections: number;
  activeStalls: number;
  inactiveStalls: number;
}> {
  const response = await fetch(`${apiBaseUrl}/reports/stalls/section-status`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to fetch stall section status");
  return response.json();
}

export async function getStallDetailsWithRevenue(token: string): Promise<StallDetails[]> {
  const response = await fetch(`${apiBaseUrl}/reports/stalls/details`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to fetch stall details");
  return response.json();
}

// ── ORDER ANALYTICS ────────────────────────────────────────────────────
export async function getOrderTrend(
  token: string,
  period: 'weekly' | 'monthly' | 'custom' = 'weekly',
  startDate?: string,
  endDate?: string
): Promise<OrderTrend> {
  const params = new URLSearchParams();
  params.append('period', period);
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  const response = await fetch(`${apiBaseUrl}/reports/orders/trend?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to fetch order trend");
  return response.json();
}

export async function getOrdersByCourseDistribution(token: string): Promise<Record<string, number>> {
  const response = await fetch(`${apiBaseUrl}/reports/orders/course-distribution`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to fetch orders by course distribution");
  return response.json();
}

// ── EXISTING FUNCTIONS ──────────────────────────────────────────────────
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

export async function getNutritionAnalytics(
  token: string,
  period: "daily" | "weekly" | "monthly"
): Promise<NutritionAnalytics> {
  const params = new URLSearchParams({ period });
  const url = `${apiBaseUrl}/reports/nutrition?${params.toString()}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("🔬 Nutrition API error:", errorText);
    throw new Error("Failed to fetch nutrition analytics");
  }

  const data = await response.json();

  return {
    labels: data.labels || [],
    protein: data.protein || [],
    carbs: data.carbs || [],
    calories: data.calories || [],
    averages: data.averages || { protein: 0, carbs: 0, calories: 0 }
  };
}

export async function getSpendingAnalytics(
  token: string, 
  period: "daily" | "weekly" | "monthly" | "custom",
  startDate?: string, 
  endDate?: string
): Promise<SpendingAnalytics> {
  const params = new URLSearchParams();
  params.append("period", period);
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  
  const response = await fetch(`${apiBaseUrl}/reports/spending?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to fetch spending analytics");
  return response.json();
}

export async function getOrderHistory(
  token: string, 
  startDate?: string, 
  endDate?: string
): Promise<any[]> {
  const params = new URLSearchParams();
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  
  const response = await fetch(`${apiBaseUrl}/orders/student/history?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to fetch order history");
  const data = await response.json() as { orders: any[] };
  return data.orders;
}