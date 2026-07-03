// ── API Base URL ────────────────────────────────────────────────────────
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";

// ── Budget Types ──────────────────────────────────────────────────────
export interface Budget {
  _id: string;
  studentId: string;
  studentTuptId: string;
  studentCourse: string;
  amount: number;
  duration: {
    startDate: string;
    endDate: string;
  };
  status: "active" | "accomplished" | "failed";
  createdAt: string;
}

export interface StudentBudgetCap {
  _id?: string;
  amount: number;
  period: "daily" | "weekly" | "monthly" | "custom";
  startDate: string;
  endDate: string;
  status: "active" | "accomplished" | "failed";
  spent?: number;
  remaining?: number;
  percentageUsed?: number;
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

// ── Budget Functions ──────────────────────────────────────────────────
export async function getBudgets(token: string): Promise<Budget[]> {
  const response = await fetch(`${apiBaseUrl}/budgets`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to fetch budgets");
  const data = await response.json() as { budgets: Budget[] };
  return data.budgets;
}

export async function getBudgetsByCourse(token: string, course: string): Promise<Budget[]> {
  const response = await fetch(`${apiBaseUrl}/budgets/course/${encodeURIComponent(course)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to fetch budgets by course");
  const data = await response.json() as { budgets: Budget[] };
  return data.budgets;
}

export async function getBudgetsByStatus(token: string, status: "active" | "accomplished" | "failed"): Promise<Budget[]> {
  const response = await fetch(`${apiBaseUrl}/budgets/status/${status}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to fetch budgets by status");
  const data = await response.json() as { budgets: Budget[] };
  return data.budgets;
}

export async function getStudentBudget(token: string): Promise<any> {
  const response = await fetch(`${apiBaseUrl}/budgets/student`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to fetch student budget");
  return response.json();
}

export async function getStudentBudgetCaps(token: string): Promise<StudentBudgetCap[]> {
  const response = await fetch(`${apiBaseUrl}/budgets/student/caps`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) {
    if (response.status === 404) return [];
    throw new Error("Failed to fetch budget caps");
  }
  const data = await response.json() as { budgets: StudentBudgetCap[] };
  return data.budgets || [];
}

export async function createBudgetCap(token: string, data: {
  amount: number;
  period: "daily" | "weekly" | "monthly" | "custom";
  startDate: string;
  endDate: string;
}): Promise<{ budgetCap: StudentBudgetCap }> {
  const response = await fetch(`${apiBaseUrl}/budgets/student/cap`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json() as { message?: string };
    throw new Error(error.message ?? "Failed to create budget cap");
  }
  return response.json();
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

export async function createBudget(token: string, budgetData: {
  studentId: string;
  amount: number;
  period: string;
  startDate: string;
  endDate: string;
}): Promise<{ budget: Budget }> {
  const response = await fetch(`${apiBaseUrl}/budgets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(budgetData),
  });
  if (!response.ok) {
    const data = await response.json() as { message?: string };
    throw new Error(data.message ?? "Failed to create budget");
  }
  return response.json();
}

export async function updateBudget(token: string, budgetId: string, updates: Partial<Budget>): Promise<{ budget: Budget }> {
  const response = await fetch(`${apiBaseUrl}/budgets/${budgetId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    const data = await response.json() as { message?: string };
    throw new Error(data.message ?? "Failed to update budget");
  }
  return response.json();
}